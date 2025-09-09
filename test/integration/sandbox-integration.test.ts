import "../setup";
import { expect, test, describe, mock } from "bun:test";
import { createMockAppFiles } from "../config.test";

interface MockFile {
	path: string;
	content: string;
}

describe("Sandbox Integration", () => {
	const mockSandboxId = "sandbox-12345";
	const mockPreviewUrl = "https://sandbox.vercel.app/app-12345";

	describe("Sandbox Creation", () => {
		test("should create sandbox with valid file structure", async () => {
			const files = createMockAppFiles();

			// Mock successful sandbox creation
			const mockSandboxResponse = {
				success: true,
				sandboxId: mockSandboxId,
				url: mockPreviewUrl,
				status: "ready",
			};

			// Simulate the sandbox creation process
			const createSandbox = mock(async (files: MockFile[]) => {
				expect(files).toHaveLength(3);
				expect(files[0].path).toBe("index.html");
				expect(files[1].path).toBe("package.json");
				expect(files[2].path).toBe("src/main.js");

				return mockSandboxResponse;
			});

			const result = await createSandbox(files);
			expect(result.success).toBe(true);
			expect(result.sandboxId).toBe(mockSandboxId);
			expect(result.url).toBe(mockPreviewUrl);
		});

		test("should handle different file types in sandbox creation", async () => {
			const files = [
				{
					path: "index.html",
					content: "<!DOCTYPE html><html><body>Hello</body></html>",
				},
				{ path: "styles.css", content: "body { background: #f0f0f0; }" },
				{ path: "script.js", content: "console.log('Hello from JS');" },
				{ path: "package.json", content: '{"name": "test-app"}' },
				{ path: "README.md", content: "# Test App" },
			];

			const createSandbox = mock(async (files: MockFile[]) => {
				expect(files).toHaveLength(5);

				// Check file types are preserved
				const htmlFile = files.find((f) => f.path.endsWith(".html"));
				const cssFile = files.find((f) => f.path.endsWith(".css"));
				const jsFile = files.find((f) => f.path.endsWith(".js"));
				const jsonFile = files.find((f) => f.path.endsWith(".json"));
				const mdFile = files.find((f) => f.path.endsWith(".md"));

				expect(htmlFile).toBeDefined();
				expect(cssFile).toBeDefined();
				expect(jsFile).toBeDefined();
				expect(jsonFile).toBeDefined();
				expect(mdFile).toBeDefined();

				return { success: true, sandboxId: mockSandboxId };
			});

			const result = await createSandbox(files);
			expect(result.success).toBe(true);
		});

		test("should detect correct port from package.json", async () => {
			const detectPort = mock((files: MockFile[]) => {
				const pkg = files.find((f) => f.path === "package.json");
				if (pkg) {
					const content = JSON.parse(pkg.content);
					if (content.dependencies?.vite) return 5173;
					if (content.dependencies?.next) return 3000;
				}
				return 3000;
			});

			// Test Vite project
			const viteFiles = [
				{
					path: "package.json",
					content: '{"dependencies": {"vite": "^4.0.0"}}',
				},
			];
			expect(detectPort(viteFiles)).toBe(5173);

			// Test Next.js project
			const nextFiles = [
				{
					path: "package.json",
					content: '{"dependencies": {"next": "^13.0.0"}}',
				},
			];
			expect(detectPort(nextFiles)).toBe(3000);

			// Test default case
			const defaultFiles = [
				{ path: "package.json", content: '{"dependencies": {}}' },
			];
			expect(detectPort(defaultFiles)).toBe(3000);
		});
	});

	describe("Sandbox Updates", () => {
		test("should update existing sandbox with new files", async () => {
			const updateSandbox = mock(
				async (sandboxId: string, files: MockFile[]) => {
					expect(sandboxId).toBe(mockSandboxId);
					expect(files).toHaveLength(2);

					return {
						success: true,
						sandboxId,
						url: mockPreviewUrl,
						sandboxReplaced: false,
					};
				},
			);

			const newFiles = [
				{
					path: "index.html",
					content: "<!DOCTYPE html><html><body>Updated</body></html>",
				},
				{ path: "styles.css", content: "body { color: red; }" },
			];

			const result = await updateSandbox(mockSandboxId, newFiles);
			expect(result.success).toBe(true);
			expect(result.sandboxReplaced).toBe(false);
		});

		test("should handle sandbox replacement when inactive", async () => {
			const updateSandbox = mock(
				async (_sandboxId: string, _files: MockFile[]) => {
					return {
						success: true,
						sandboxId: "new-sandbox-67890",
						url: "https://sandbox.vercel.app/new-app-67890",
						sandboxReplaced: true,
					};
				},
			);

			const result = await updateSandbox(mockSandboxId, createMockAppFiles());
			expect(result.success).toBe(true);
			expect(result.sandboxReplaced).toBe(true);
			expect(result.sandboxId).not.toBe(mockSandboxId);
		});

		test("should preserve file structure during updates", async () => {
			const originalFiles = createMockAppFiles();
			const updatedFiles = [
				...originalFiles,
				{
					path: "components/Button.js",
					content: "export const Button = () => <button>Click</button>;",
				},
			];

			const updateSandbox = mock(
				async (sandboxId: string, files: MockFile[]) => {
					expect(files).toHaveLength(4); // Original 3 + 1 new

					const buttonFile = files.find(
						(f) => f.path === "components/Button.js",
					);
					expect(buttonFile).toBeDefined();
					expect(buttonFile?.content).toContain("Button");

					return { success: true, sandboxId };
				},
			);

			const result = await updateSandbox(mockSandboxId, updatedFiles);
			expect(result.success).toBe(true);
		});
	});

	describe("Sandbox URL Management", () => {
		test("should add cache-busting parameters to URLs", async () => {
			const addCacheBusting = mock((url: string) => {
				const urlObj = new URL(url);
				urlObj.searchParams.set("t", "1234567890");
				return urlObj.toString();
			});

			const originalUrl = "https://sandbox.vercel.app/app-123";
			const cacheBustedUrl = addCacheBusting(originalUrl);

			expect(cacheBustedUrl).toContain("t=1234567890");
			expect(cacheBustedUrl).toContain("sandbox.vercel.app");
		});

		test("should handle URLs without existing query parameters", async () => {
			const addCacheBusting = mock((url: string) => {
				return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
			});

			const urlWithoutParams = "https://sandbox.vercel.app/app-123";
			const urlWithParams = "https://sandbox.vercel.app/app-123?existing=param";

			const result1 = addCacheBusting(urlWithoutParams);
			const result2 = addCacheBusting(urlWithParams);

			expect(result1).toContain("?t=");
			expect(result2).toContain("&t=");
		});

		test("should get correct sandbox URL for specific port", async () => {
			const getSandboxUrl = mock(async (sandboxId: string, port: number) => {
				return {
					url: `https://sandbox.vercel.app/${sandboxId}?port=${port}`,
				};
			});

			const port3000 = await getSandboxUrl(mockSandboxId, 3000);
			const port5173 = await getSandboxUrl(mockSandboxId, 5173);

			expect(port3000.url).toContain("port=3000");
			expect(port5173.url).toContain("port=5173");
		});
	});

	describe("Sandbox Streaming", () => {
		test("should handle streaming sandbox creation progress", async () => {
			const mockStreamingStates = [
				{
					isLoading: true,
					message: "Installing dependencies...",
					progress: 25,
				},
				{ isLoading: true, message: "Building application...", progress: 50 },
				{
					isLoading: true,
					message: "Starting development server...",
					progress: 75,
				},
				{
					isLoading: false,
					result: { url: mockPreviewUrl, sandboxId: mockSandboxId },
				},
			];

			const startSandboxStreaming = mock(async function* () {
				for (const state of mockStreamingStates) {
					yield state;
					await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
				}
			});

			const states = [];
			for await (const state of startSandboxStreaming()) {
				states.push(state);
			}

			expect(states).toHaveLength(4);
			expect(states[0].isLoading).toBe(true);
			expect(states[0].progress).toBe(25);
			expect(states[3].isLoading).toBe(false);
			expect(states[3].result.url).toBe(mockPreviewUrl);
		});

		test("should handle streaming sandbox errors", async () => {
			const startSandboxStreaming = mock(async function* () {
				yield {
					isLoading: true,
					message: "Installing dependencies...",
					progress: 10,
				};
				yield { isLoading: false, error: "Failed to install dependencies" };
			});

			const states = [];
			for await (const state of startSandboxStreaming()) {
				states.push(state);
			}

			expect(states).toHaveLength(2);
			expect(states[1].isLoading).toBe(false);
			expect(states[1].error).toBe("Failed to install dependencies");
		});
	});

	describe("Sandbox File Validation", () => {
		test("should validate file structure before sandbox creation", async () => {
			const validateFiles = mock((files: MockFile[]) => {
				if (!Array.isArray(files) || files.length === 0) {
					throw new Error("Files array is required");
				}

				for (const file of files) {
					if (!file.path || typeof file.path !== "string") {
						throw new Error("Each file must have a valid path");
					}
					if (!file.content || typeof file.content !== "string") {
						throw new Error("Each file must have valid content");
					}
					if (file.path.includes("..") || file.path.startsWith("/")) {
						throw new Error("File paths must be relative and safe");
					}
				}

				return true;
			});

			// Valid files
			const validFiles = createMockAppFiles();
			expect(validateFiles(validFiles)).toBe(true);

			// Invalid files - missing path
			expect(() => validateFiles([{ content: "test" }])).toThrow("valid path");

			// Invalid files - absolute path
			expect(() =>
				validateFiles([{ path: "/etc/passwd", content: "test" }]),
			).toThrow("relative and safe");

			// Invalid files - path traversal
			expect(() =>
				validateFiles([{ path: "../secret.txt", content: "test" }]),
			).toThrow("relative and safe");
		});

		test("should handle large file uploads", async () => {
			const largeContent = "x".repeat(1024 * 1024); // 1MB file
			const largeFiles = [
				{ path: "large-file.txt", content: largeContent },
				...createMockAppFiles(),
			];

			const validateLargeFiles = mock((files: MockFile[]) => {
				const totalSize = files.reduce(
					(size, file) => size + file.content.length,
					0,
				);
				if (totalSize > 10 * 1024 * 1024) {
					// 10MB limit
					throw new Error("Total file size exceeds limit");
				}
				return true;
			});

			expect(validateLargeFiles(largeFiles)).toBe(true);

			// Test size limit
			const hugeFiles = [
				{ path: "huge.txt", content: "x".repeat(15 * 1024 * 1024) }, // 15MB
			];

			expect(() => validateLargeFiles(hugeFiles)).toThrow("exceeds limit");
		});
	});

	describe("Sandbox Cleanup", () => {
		test("should properly clean up sandbox resources", async () => {
			const cleanupSandbox = mock(async (sandboxId: string) => {
				expect(sandboxId).toBe(mockSandboxId);
				return { success: true, message: "Sandbox cleaned up" };
			});

			const result = await cleanupSandbox(mockSandboxId);
			expect(result.success).toBe(true);
			expect(result.message).toContain("cleaned up");
		});

		test("should handle cleanup of non-existent sandboxes gracefully", async () => {
			const cleanupSandbox = mock(async (sandboxId: string) => {
				if (sandboxId === "non-existent") {
					return { success: false, error: "Sandbox not found" };
				}
				return { success: true };
			});

			const result = await cleanupSandbox("non-existent");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Sandbox not found");
		});
	});
});
