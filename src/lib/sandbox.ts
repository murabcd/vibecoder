import { createServerFn } from "@tanstack/react-start";
import z from "zod/v3";

// ------------------------------
// Streaming Support
// ------------------------------

export type SandboxEvent =
	| { type: "status"; message: string; progress?: number }
	| { type: "error"; error: string }
	| {
			type: "complete";
			result: { sandboxId: string; url: string; port: number };
	  };

// Simple event emitter for streaming updates - currently unused but kept for future implementation

// ------------------------------
// Shared validation & utilities
// ------------------------------

const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB per file
const MAX_TOTAL_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB total

function isSafeRelativePath(path: string): boolean {
	if (typeof path !== "string" || path.trim() === "") return false;
	if (path.startsWith("/")) return false;
	if (path.includes("..")) return false;
	// Disallow Windows drive letters or backslashes
	if (/^[a-zA-Z]:\\/.test(path)) return false;
	if (path.includes("\\")) return false;
	return true;
}

function validateFilesPayload(
	files: Array<{ path: string; content: string }>,
): void {
	let totalBytes = 0;
	for (const file of files) {
		if (!isSafeRelativePath(file.path)) {
			throw new Error(`Invalid file path: ${file.path}`);
		}
		const bytes = Buffer.byteLength(file.content, "utf8");
		if (bytes > MAX_FILE_SIZE_BYTES) {
			throw new Error(
				`File too large: ${file.path} exceeds ${MAX_FILE_SIZE_BYTES} bytes`,
			);
		}
		totalBytes += bytes;
		if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
			throw new Error(
				`Total payload too large: exceeds ${MAX_TOTAL_SIZE_BYTES} bytes`,
			);
		}
	}
}

function detectPreferredPortFromPackageJson(pkgJson: unknown): number {
	try {
		const pkg = pkgJson as {
			scripts?: Record<string, string>;
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const depsBlob = JSON.stringify({
			...pkg?.dependencies,
			...pkg?.devDependencies,
		});
		// Avoid 8080 (reserved internally by Vercel Sandbox)
		if (/vite/i.test(depsBlob)) return 5173;
		if (/next/i.test(depsBlob)) return 3000;
	} catch {}
	return 3000;
}

function ensureExposedPort(
	ports: number[] | undefined,
	desired: number,
): number[] {
	const avoid = new Set([8080]);
	const base = Array.isArray(ports) && ports.length > 0 ? [...ports] : [];
	const normalized = base.filter((p) => !avoid.has(p));
	if (!normalized.includes(desired)) normalized.push(desired);
	return normalized.length > 0 ? normalized : [3000];
}

// This server function creates a Vercel Sandbox, writes the provided HTML
// to an index.html file, starts a static HTTP server on port 3000 inside the
// sandbox, and returns the public URL to access it.
export const initHtmlSandboxOnServer = createServerFn({ method: "POST" })
	.validator((html: string): string => {
		if (typeof html !== "string" || html.trim() === "") {
			throw new Error("HTML cannot be empty.");
		}
		return html;
	})
	.handler(async ({ data: html }: { data: string }) => {
		// Import server-only to avoid bundling for client
		const { Sandbox } = await import("@vercel/sandbox");

		// Create sandbox and expose port 3000 for the static server
		const sandbox = await Sandbox.create({ ports: [3000] });

		// Write the HTML and a minimal package.json (optional)
		await sandbox.writeFiles([
			{
				path: "index.html",
				content: Buffer.from(html, "utf8"),
			},
		]);

		// Start a static server. We leverage npx to avoid a manual install.
		// -y to skip prompts, -p 3000 for port, -a 0.0.0.0 to bind publicly.
		await sandbox.runCommand({
			cmd: "npx",
			args: ["-y", "http-server", "-p", "3000", "-a", "0.0.0.0"],
			detached: true,
		});

		// Return the public URL for port 3000
		const url = sandbox.domain(3000);
		return { sandboxId: sandbox.sandboxId, url };
	});

// Zod schema for JSON file payload
export const SandboxFileSchema = z.object({
	path: z.string(),
	content: z.string(),
});

export const SandboxFilesPayloadSchema = z.object({
	files: z.array(SandboxFileSchema).min(1),
	timeout: z.number().optional().default(300000), // 5 minutes default, same as reference app
	ports: z.array(z.number()).max(2).optional(),
});

// ------------------------------
// Operation State Management
// ------------------------------

export const OperationStatusSchema = z.object({
	id: z.string(),
	type: z.enum([
		"sandbox-creation",
		"file-generation",
		"command-execution",
		"file-upload",
		"file-read",
	]),
	status: z.enum(["pending", "running", "completed", "failed"]),
	progress: z.number().min(0).max(100).optional(),
	message: z.string().optional(),
	startedAt: z.number(),
	completedAt: z.number().optional(),
	metadata: z.record(z.unknown()).optional(),
});

export const CommandStateSchema = z.object({
	commandId: z.string(),
	sandboxId: z.string(),
	command: z.string(),
	args: z.array(z.string()),
	status: z.enum(["running", "completed", "failed"]),
	exitCode: z.number().optional(),
	startedAt: z.number(),
	completedAt: z.number().optional(),
});

export const SandboxStateSchema = z.object({
	sandboxId: z.string(),
	status: z.enum(["initializing", "running", "stopped", "error"]),
	createdAt: z.number(),
	timeout: z.number().optional(),
	ports: z.array(z.number()).optional(),
	runningCommands: z.array(z.string()).optional(),
});

export type OperationStatus = z.infer<typeof OperationStatusSchema>;
export type CommandState = z.infer<typeof CommandStateSchema>;
export type SandboxState = z.infer<typeof SandboxStateSchema>;

// Type for command execution result
interface CommandResult {
	exitCode: number;
	stdout: () => Promise<string>;
	stderr: () => Promise<string>;
}

// Streaming version of sandbox initialization
export const initSandboxWithFilesStreamOnServer = createServerFn({
	method: "POST",
})
	.validator((payload: unknown) => SandboxFilesPayloadSchema.parse(payload))
	.handler(async function* ({
		data,
	}: {
		data: z.infer<typeof SandboxFilesPayloadSchema>;
	}) {
		const { Sandbox } = await import("@vercel/sandbox");

		yield {
			type: "status",
			message: "Validating files...",
			progress: 10,
		} as SandboxEvent;
		validateFilesPayload(data.files);

		yield {
			type: "status",
			message: "Analyzing project structure...",
			progress: 20,
		} as SandboxEvent;

		// Detect preferred app port from package.json if present
		const pkgFile = data.files.find((f) =>
			/(^|\/)package\.json$/i.test(f.path),
		);
		let pkgJson: {
			packageManager?: string;
			scripts?: Record<string, string>;
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		} | null = null;
		if (pkgFile) {
			try {
				pkgJson = JSON.parse(pkgFile.content.toString());
			} catch {}
		}
		const desiredPort = pkgJson
			? detectPreferredPortFromPackageJson(pkgJson)
			: 3000;
		const ports = ensureExposedPort(data.ports, desiredPort);

		yield {
			type: "status",
			message: "Creating sandbox environment...",
			progress: 30,
		} as SandboxEvent;
		const sandbox = await Sandbox.create({ timeout: data.timeout, ports });

		yield {
			type: "status",
			message: "Writing files to sandbox...",
			progress: 40,
		} as SandboxEvent;
		// Write all files
		await sandbox.writeFiles(
			data.files.map((f) => ({
				path: f.path,
				content: Buffer.from(f.content, "utf8"),
			})),
		);

		// Branch: SPA (index.html) vs Fullstack (package.json)
		const hasIndexHtml = data.files.some((f) =>
			/(^|\/)index\.html$/i.test(f.path),
		);

		try {
			if (pkgFile) {
				yield {
					type: "status",
					message: "Setting up dependencies...",
					progress: 50,
				} as SandboxEvent;

				const pkgMgr: "pnpm" | "bun" | "npm" = /pnpm/.test(
					pkgJson?.packageManager ?? "",
				)
					? "pnpm"
					: /bun/.test(pkgJson?.packageManager ?? "")
						? "bun"
						: "npm";

				// Try install with inferred manager, then fallback to npm with safe flags
				async function runInstall(): Promise<void> {
					let exit = 1;
					if (pkgMgr === "pnpm") {
						const p = await sandbox.runCommand({
							cmd: "npx",
							args: ["-y", "pnpm", "i", "--no-frozen-lockfile"],
						});
						exit = (await p.wait()).exitCode;
					} else if (pkgMgr === "bun") {
						const p = await sandbox.runCommand({
							cmd: "bun",
							args: ["install"],
						});
						exit = (await p.wait()).exitCode;
					} else {
						const p = await sandbox.runCommand({
							cmd: "npm",
							args: [
								"install",
								"--silent",
								"--no-audit",
								"--no-fund",
								"--legacy-peer-deps",
							],
						});
						exit = (await p.wait()).exitCode;
					}
					if (exit !== 0) {
						const p = await sandbox.runCommand({
							cmd: "npm",
							args: [
								"install",
								"--silent",
								"--no-audit",
								"--no-fund",
								"--legacy-peer-deps",
							],
						});
						const r = await p.wait();
						if (r.exitCode !== 0) {
							throw new Error("npm install failed inside sandbox");
						}
					}
				}
				await runInstall();

				yield {
					type: "status",
					message: "Starting development server...",
					progress: 70,
				} as SandboxEvent;

				// Start dev server. Prefer declared dev script; fallback to common frameworks.
				const hasDevScript = typeof pkgJson?.scripts?.dev === "string";
				if (hasDevScript) {
					const runCmd =
						pkgMgr === "pnpm"
							? ["npx", ["-y", "pnpm", "run", "dev"]]
							: pkgMgr === "bun"
								? ["bun", ["run", "dev"]]
								: ["npm", ["run", "dev"]];
					await sandbox.runCommand({
						cmd: runCmd[0] as string,
						args: runCmd[1] as string[],
						detached: true,
					});
				} else if (
					/next/i.test(
						JSON.stringify({
							...pkgJson?.dependencies,
							...pkgJson?.devDependencies,
						}),
					)
				) {
					await sandbox.runCommand({
						cmd: "npx",
						args: [
							"-y",
							"next",
							"dev",
							"-p",
							String(desiredPort),
							"-H",
							"0.0.0.0",
						],
						detached: true,
					});
				} else if (
					/vite/i.test(
						JSON.stringify({
							...pkgJson?.dependencies,
							...pkgJson?.devDependencies,
						}),
					)
				) {
					await sandbox.runCommand({
						cmd: "npx",
						args: ["-y", "vite", "--port", String(desiredPort), "--host"],
						detached: true,
					});
				} else {
					// Last resort: try node server.js if present
					await sandbox.runCommand({
						cmd: "node",
						args: ["server.js"],
						detached: true,
					});
				}
			} else if (hasIndexHtml) {
				yield {
					type: "status",
					message: "Starting static file server...",
					progress: 70,
				} as SandboxEvent;
				// Serve static HTML
				await sandbox.runCommand({
					cmd: "npx",
					args: [
						"-y",
						"http-server",
						"-p",
						String(desiredPort),
						"-a",
						"0.0.0.0",
					],
					detached: true,
				});
			}

			const url = sandbox.domain(desiredPort);

			yield {
				type: "status",
				message: "Waiting for server to be ready...",
				progress: 85,
			} as SandboxEvent;

			// Wait for server readiness to avoid initial 502s
			const maxWaitMs = 60000;
			const pollIntervalMs = 400;
			const start = Date.now();
			while (Date.now() - start < maxWaitMs) {
				try {
					const res = await fetch(url, { method: "HEAD" });
					if (res.ok) {
						break;
					}
				} catch {
					// ignore and retry
				}
				await new Promise((r) => setTimeout(r, pollIntervalMs));
			}

			const result = { sandboxId: sandbox.sandboxId, url, port: desiredPort };
			yield { type: "complete", result, progress: 100 } as SandboxEvent;
			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			yield { type: "error", error: errorMessage } as SandboxEvent;
			throw error;
		}
	});

// Initialize a sandbox with a set of files described in JSON, validated by zod/v3
export const initSandboxWithFilesOnServer = createServerFn({ method: "POST" })
	.validator((payload: unknown) => SandboxFilesPayloadSchema.parse(payload))
	.handler(
		async ({ data }: { data: z.infer<typeof SandboxFilesPayloadSchema> }) => {
			const { Sandbox } = await import("@vercel/sandbox");

			validateFilesPayload(data.files);

			// Detect preferred app port from package.json if present
			const pkgFile = data.files.find((f) =>
				/(^|\/)package\.json$/i.test(f.path),
			);
			let pkgJson: {
				packageManager?: string;
				scripts?: Record<string, string>;
				dependencies?: Record<string, string>;
				devDependencies?: Record<string, string>;
			} | null = null;
			if (pkgFile) {
				try {
					pkgJson = JSON.parse(pkgFile.content.toString());
				} catch {}
			}
			const desiredPort = pkgJson
				? detectPreferredPortFromPackageJson(pkgJson)
				: 3000;
			const ports = ensureExposedPort(data.ports, desiredPort);

			const _sandboxStartTime = Date.now();
			const sandbox = await Sandbox.create({
				timeout: data.timeout || 300000, // 5 minutes default
				ports,
			});

			// Write all files
			const _writeStartTime = Date.now();
			await sandbox.writeFiles(
				data.files.map((f) => ({
					path: f.path,
					content: Buffer.from(f.content, "utf8"),
				})),
			);

			// Branch: SPA (index.html) vs Fullstack (package.json)
			const hasIndexHtml = data.files.some((f) =>
				/(^|\/)index\.html$/i.test(f.path),
			);

			if (pkgFile) {
				const pkgMgr: "pnpm" | "bun" | "npm" = /pnpm/.test(
					pkgJson?.packageManager ?? "",
				)
					? "pnpm"
					: /bun/.test(pkgJson?.packageManager ?? "")
						? "bun"
						: "npm";

				// Try install with inferred manager, then fallback to npm with safe flags
				async function runInstall(): Promise<void> {
					const _installStartTime = Date.now();
					let exit = 1;
					if (pkgMgr === "pnpm") {
						const p = await sandbox.runCommand({
							cmd: "npx",
							args: ["-y", "pnpm", "i", "--no-frozen-lockfile"],
						});
						exit = (await p.wait()).exitCode;
					} else if (pkgMgr === "bun") {
						const p = await sandbox.runCommand({
							cmd: "bun",
							args: ["install"],
						});
						exit = (await p.wait()).exitCode;
					} else {
						const p = await sandbox.runCommand({
							cmd: "npm",
							args: [
								"install",
								"--silent",
								"--no-audit",
								"--no-fund",
								"--legacy-peer-deps",
							],
						});
						exit = (await p.wait()).exitCode;
					}
					if (exit !== 0) {
						const p = await sandbox.runCommand({
							cmd: "npm",
							args: [
								"install",
								"--silent",
								"--no-audit",
								"--no-fund",
								"--legacy-peer-deps",
							],
						});
						const r = await p.wait();
						if (r.exitCode !== 0) {
							throw new Error("npm install failed inside sandbox");
						}
					}
				}
				await runInstall();

				// Start dev server. Prefer declared dev script; fallback to common frameworks.
				const hasDevScript = typeof pkgJson?.scripts?.dev === "string";
				if (hasDevScript) {
					const runCmd =
						pkgMgr === "pnpm"
							? ["npx", ["-y", "pnpm", "run", "dev"]]
							: pkgMgr === "bun"
								? ["bun", ["run", "dev"]]
								: ["npm", ["run", "dev"]];
					await sandbox.runCommand({
						cmd: runCmd[0] as string,
						args: runCmd[1] as string[],
						detached: true,
					});
				} else if (
					/next/i.test(
						JSON.stringify({
							...pkgJson?.dependencies,
							...pkgJson?.devDependencies,
						}),
					)
				) {
					await sandbox.runCommand({
						cmd: "npx",
						args: [
							"-y",
							"next",
							"dev",
							"-p",
							String(desiredPort),
							"-H",
							"0.0.0.0",
						],
						detached: true,
					});
				} else if (
					/vite/i.test(
						JSON.stringify({
							...pkgJson?.dependencies,
							...pkgJson?.devDependencies,
						}),
					)
				) {
					await sandbox.runCommand({
						cmd: "npx",
						args: ["-y", "vite", "--port", String(desiredPort), "--host"],
						detached: true,
					});
				} else {
					// Last resort: try node server.js if present
					await sandbox.runCommand({
						cmd: "node",
						args: ["server.js"],
						detached: true,
					});
				}
			} else if (hasIndexHtml) {
				// Serve static HTML
				await sandbox.runCommand({
					cmd: "npx",
					args: [
						"-y",
						"http-server",
						"-p",
						String(desiredPort),
						"-a",
						"0.0.0.0",
					],
					detached: true,
				});
			}

			const url = sandbox.domain(desiredPort);

			// Wait for server readiness to avoid initial 502s
			const maxWaitMs = 60000;
			const pollIntervalMs = 400;
			const start = Date.now();
			let _attempts = 0;
			while (Date.now() - start < maxWaitMs) {
				_attempts++;
				try {
					const res = await fetch(url, { method: "HEAD" });
					if (res.ok) {
						break;
					}
				} catch (_error) {
					// Server not ready, continue polling
				}
				await new Promise((r) => setTimeout(r, pollIntervalMs));
			}

			return { sandboxId: sandbox.sandboxId, url, port: desiredPort };
		},
	);

// ------------------------------
// Additional server utilities
// ------------------------------

export const getSandboxUrlOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z.object({ sandboxId: z.string(), port: z.number() }).parse(input),
	)
	.handler(async ({ data }: { data: { sandboxId: string; port: number } }) => {
		const { Sandbox } = await import("@vercel/sandbox");
		// Avoid reserved port
		if (data.port === 8080) {
			throw new Error(
				"Port 8080 is reserved inside the sandbox; use a different port.",
			);
		}
		const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
		return { url: sandbox.domain(data.port) };
	});

export const updateSandboxFilesOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				files: SandboxFilesPayloadSchema.shape.files,
			})
			.parse(input),
	)
	.handler(
		async ({
			data,
		}: {
			data: {
				sandboxId: string;
				files: z.infer<typeof SandboxFilesPayloadSchema>["files"];
			};
		}) => {
			const { Sandbox } = await import("@vercel/sandbox");
			validateFilesPayload(data.files);
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
			await sandbox.writeFiles(
				data.files.map((f) => ({
					path: f.path,
					content: Buffer.from(f.content, "utf8"),
				})),
			);
			return { ok: true };
		},
	);

// Legacy synchronous command function - kept for backward compatibility
export const runSandboxCommandOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				cmd: z.string(),
				args: z.array(z.string()).optional(),
				detached: z.boolean().optional(),
			})
			.parse(input),
	)
	.handler(
		async ({
			data,
		}: {
			data: {
				sandboxId: string;
				cmd: string;
				args?: string[];
				detached?: boolean;
			};
		}) => {
			const { Sandbox } = await import("@vercel/sandbox");
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
			const proc = await sandbox.runCommand({
				cmd: data.cmd,
				args: data.args ?? [],
				detached: data.detached ?? false,
			});
			if (data.detached) return { started: true };
			const result = await proc.wait();
			return { exitCode: result.exitCode };
		},
	);

// ------------------------------
// Asynchronous Command Pattern
// ------------------------------

export const startSandboxCommandOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				cmd: z.string(),
				args: z.array(z.string()).optional(),
				sudo: z.boolean().optional(),
			})
			.parse(input),
	)
	.handler(
		async ({
			data,
		}: {
			data: {
				sandboxId: string;
				cmd: string;
				args?: string[];
				sudo?: boolean;
			};
		}) => {
			const { Sandbox } = await import("@vercel/sandbox");
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
			const proc = await sandbox.runCommand({
				cmd: data.cmd,
				args: data.args ?? [],
				sudo: data.sudo ?? false,
				detached: true,
			});
			return {
				commandId: proc.cmdId,
				sandboxId: data.sandboxId,
				command: data.cmd,
				args: data.args ?? [],
				startedAt: Date.now(),
			};
		},
	);

export const waitSandboxCommandOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				commandId: z.string(),
			})
			.parse(input),
	)
	.handler(
		async ({
			data,
		}: {
			data: {
				sandboxId: string;
				commandId: string;
			};
		}) => {
			const { Sandbox } = await import("@vercel/sandbox");
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
			const command = await sandbox.getCommand(data.commandId);
			const result = await command.wait();
			const [stdout, stderr] = await Promise.all([
				result.stdout(),
				result.stderr(),
			]);

			return {
				commandId: data.commandId,
				exitCode: result.exitCode,
				stdout,
				stderr,
				completedAt: Date.now(),
			};
		},
	);

export const checkSandboxStatusOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({ sandboxId: z.string(), port: z.number().optional() })
			.parse(input),
	)
	.handler(async ({ data }: { data: { sandboxId: string; port?: number } }) => {
		const { Sandbox } = await import("@vercel/sandbox");
		let sandbox: Awaited<ReturnType<typeof Sandbox.get>>;
		try {
			sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
		} catch {
			return { status: "stopped" as const };
		}
		if (typeof data.port === "number") {
			if (data.port === 8080) return { status: "reserved" as const };
			try {
				const url = sandbox.domain(data.port);
				const res = await fetch(url, { method: "HEAD" });
				return {
					status: res.ok ? ("ok" as const) : ("unreachable" as const),
					url,
				};
			} catch {
				return { status: "unreachable" as const };
			}
		}
		// Without a port to check, just return that sandbox exists
		return { status: "ok" as const };
	});

// ------------------------------
// File Management
// ------------------------------

export const readSandboxFileOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				filePath: z.string(),
			})
			.parse(input),
	)
	.handler(
		async ({ data }: { data: { sandboxId: string; filePath: string } }) => {
			const { Sandbox } = await import("@vercel/sandbox");
			if (!isSafeRelativePath(data.filePath)) {
				throw new Error(`Invalid file path: ${data.filePath}`);
			}
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
			const stream = await sandbox.readFile({ path: data.filePath });
			if (!stream) {
				throw new Error("File not found in sandbox");
			}

			// Convert stream to string
			const chunks: Buffer[] = [];
			for await (const chunk of stream) {
				chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
			}
			const buffer = Buffer.concat(chunks);
			const content = buffer.toString("utf8");

			return { content, path: data.filePath };
		},
	);

export const listSandboxFilesOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				path: z.string().optional(),
			})
			.parse(input),
	)
	.handler(async ({ data }: { data: { sandboxId: string; path?: string } }) => {
		const { Sandbox } = await import("@vercel/sandbox");
		const dirPath = data.path || ".";
		if (!isSafeRelativePath(dirPath)) {
			throw new Error(`Invalid directory path: ${dirPath}`);
		}
		const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });

		// Use ls command to list files
		const proc = await sandbox.runCommand({
			cmd: "ls",
			args: ["-la", dirPath],
		});
		const result = await proc.wait();
		const stdout = await result.stdout();

		if (result.exitCode !== 0) {
			throw new Error("Failed to list directory contents");
		}

		return { files: stdout, path: dirPath };
	});

// ------------------------------
// Command State Management
// ------------------------------

export const getCommandStatusOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				commandId: z.string(),
			})
			.parse(input),
	)
	.handler(
		async ({ data }: { data: { sandboxId: string; commandId: string } }) => {
			const { Sandbox } = await import("@vercel/sandbox");
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });
			try {
				const command = await sandbox.getCommand(data.commandId);

				// Use a timeout-based approach to check command status
				let status: "running" | "completed" | "failed" = "running";
				let exitCode: number | undefined;
				let stdout = "";
				let stderr = "";

				try {
					// Try to wait for the command with a very short timeout
					const result = await Promise.race([
						command.wait(),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error("timeout")), 100),
						),
					]);

					// If we get here, command is completed
					status = "completed";
					const cmdResult = result as CommandResult;
					exitCode = cmdResult.exitCode;

					// Get output if available
					try {
						stdout = await cmdResult.stdout();
						stderr = await cmdResult.stderr();
					} catch {
						// Output might not be available yet
					}
				} catch (error) {
					// Command is either still running or failed
					if (error instanceof Error && error.message === "timeout") {
						status = "running";
					} else {
						status = "failed";
					}
				}

				return {
					commandId: data.commandId,
					status,
					exitCode,
					stdout: stdout || undefined,
					stderr: stderr || undefined,
					isRunning: status === "running",
				};
			} catch (error) {
				return {
					commandId: data.commandId,
					status: "failed" as const,
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		},
	);

export const listSandboxCommandsOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
			})
			.parse(input),
	)
	.handler(async ({ data }: { data: { sandboxId: string } }) => {
		const { Sandbox } = await import("@vercel/sandbox");
		const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });

		// Use ps command to list processes
		try {
			const proc = await sandbox.runCommand({
				cmd: "ps",
				args: ["aux"],
			});
			const result = await proc.wait();
			const stdout = await result.stdout();

			if (result.exitCode !== 0) {
				throw new Error("Failed to list processes");
			}

			return {
				processes: stdout,
				sandboxId: data.sandboxId,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : "Unknown error",
				sandboxId: data.sandboxId,
			};
		}
	});

export const killSandboxCommandOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
				commandId: z.string().optional(),
				processId: z.number().optional(),
			})
			.parse(input),
	)
	.handler(
		async ({
			data,
		}: {
			data: {
				sandboxId: string;
				commandId?: string;
				processId?: number;
			};
		}) => {
			const { Sandbox } = await import("@vercel/sandbox");
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });

			if (data.commandId) {
				try {
					const command = await sandbox.getCommand(data.commandId);
					await command.kill();
					return {
						killed: true,
						commandId: data.commandId,
						method: "command",
					};
				} catch (error) {
					return {
						killed: false,
						error: error instanceof Error ? error.message : "Unknown error",
						commandId: data.commandId,
					};
				}
			} else if (data.processId) {
				try {
					const proc = await sandbox.runCommand({
						cmd: "kill",
						args: ["-9", data.processId.toString()],
					});
					const result = await proc.wait();

					return {
						killed: result.exitCode === 0,
						processId: data.processId,
						exitCode: result.exitCode,
						method: "process",
					};
				} catch (error) {
					return {
						killed: false,
						error: error instanceof Error ? error.message : "Unknown error",
						processId: data.processId,
					};
				}
			} else {
				throw new Error("Either commandId or processId must be provided");
			}
		},
	);

export const getSandboxInfoOnServer = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				sandboxId: z.string(),
			})
			.parse(input),
	)
	.handler(async ({ data }: { data: { sandboxId: string } }) => {
		const { Sandbox } = await import("@vercel/sandbox");
		try {
			const sandbox = await Sandbox.get({ sandboxId: data.sandboxId });

			// Get basic system info
			const [uptimeProc, dfProc] = await Promise.all([
				sandbox.runCommand({ cmd: "uptime" }),
				sandbox.runCommand({ cmd: "df", args: ["-h"] }),
			]);

			const [uptimeResult, dfResult] = await Promise.all([
				uptimeProc.wait(),
				dfProc.wait(),
			]);

			const [uptimeOutput, diskUsage] = await Promise.all([
				uptimeResult.stdout(),
				dfResult.stdout(),
			]);

			return {
				sandboxId: data.sandboxId,
				uptime: uptimeOutput.trim(),
				diskUsage,
				timestamp: Date.now(),
				status: "running" as const,
			};
		} catch (error) {
			return {
				sandboxId: data.sandboxId,
				status: "error" as const,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: Date.now(),
			};
		}
	});
