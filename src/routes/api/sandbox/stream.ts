import { createServerFileRoute } from "@tanstack/react-start/server";
import { SandboxFilesPayloadSchema, type SandboxEvent } from "@/lib/sandbox";

function isSafeRelativePath(path: string): boolean {
	if (typeof path !== "string" || path.trim() === "") return false;
	if (path.startsWith("/")) return false;
	if (path.includes("..")) return false;
	if (/^[a-zA-Z]:\\/.test(path)) return false;
	if (path.includes("\\")) return false;
	return true;
}

function validateFilesPayload(
	files: Array<{ path: string; content: string }>,
): void {
	const MAX_FILE_SIZE_BYTES = 512 * 1024;
	const MAX_TOTAL_SIZE_BYTES = 3 * 1024 * 1024;
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

export const ServerRoute = createServerFileRoute("/api/sandbox/stream").methods(
	{
		POST: async ({ request }) => {
			try {
				const body = await request.json();
				const data = SandboxFilesPayloadSchema.parse(body);

				const encoder = new TextEncoder();

				return new Response(
					new ReadableStream({
						async start(controller) {
							try {
								const { Sandbox } = await import("@vercel/sandbox");

								const sendEvent = (event: SandboxEvent) => {
									controller.enqueue(
										encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
									);
								};

								sendEvent({
									type: "status",
									message: "Validating files...",
									progress: 10,
								});
								validateFilesPayload(data.files);

								sendEvent({
									type: "status",
									message: "Analyzing project structure...",
									progress: 20,
								});

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

								sendEvent({
									type: "status",
									message: "Creating sandbox environment...",
									progress: 30,
								});

								const sandbox = await Sandbox.create({
									timeout: data.timeout,
									ports,
									runtime: "node22",
								}).catch((error) => {
									console.error("Sandbox creation failed:", error);
									console.error("Error details:", {
										message: error.message,
										status: error.status,
										code: error.code,
										stack: error.stack,
									});
									throw error;
								});

								sendEvent({
									type: "status",
									message: "Writing files to sandbox...",
									progress: 40,
								});

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

								if (pkgFile) {
									sendEvent({
										type: "status",
										message: "Setting up dependencies...",
										progress: 50,
									});

									const pkgMgr: "pnpm" | "npm" = /pnpm/.test(
										pkgJson?.packageManager ?? "",
									)
										? "pnpm"
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

									sendEvent({
										type: "status",
										message: "Starting development server...",
										progress: 70,
									});

									// Start dev server. Prefer declared dev script; fallback to common frameworks.
									const hasDevScript =
										typeof pkgJson?.scripts?.dev === "string";
									if (hasDevScript) {
										const runCmd =
											pkgMgr === "pnpm"
												? ["npx", ["-y", "pnpm", "run", "dev"]]
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
											args: [
												"-y",
												"vite",
												"--port",
												String(desiredPort),
												"--host",
											],
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
									sendEvent({
										type: "status",
										message: "Starting static file server...",
										progress: 70,
									});
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

								sendEvent({
									type: "status",
									message: "Waiting for server to be ready...",
									progress: 85,
								});

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

								const result = {
									sandboxId: sandbox.sandboxId,
									url,
									port: desiredPort,
								};
								sendEvent({ type: "complete", result });
								controller.close();
							} catch (error) {
								const errorMessage =
									error instanceof Error
										? error.message
										: "Unknown error occurred";
								controller.enqueue(
									encoder.encode(
										`data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`,
									),
								);
								controller.close();
							}
						},
					}),
					{
						headers: {
							"Content-Type": "text/event-stream",
							"Cache-Control": "no-cache",
							Connection: "keep-alive",
						},
					},
				);
			} catch (error) {
				return new Response(
					JSON.stringify({
						error: error instanceof Error ? error.message : "Unknown error",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		},
	},
);
