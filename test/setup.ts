// Test setup file for Bun tests
import { expect } from "bun:test";

interface MockFile {
	path: string;
	content: string;
}

interface MockAppStructure {
	files: MockFile[];
}

// Global test setup
console.log("Setting up test environment...");

// Always set up global window object for tests
globalThis.window =
	globalThis.window ||
	({
		triggerAppGeneration: undefined,
		handleFollowUpSubmit: undefined,
	} as Window & {
		triggerAppGeneration?: (description: string) => Promise<unknown>;
		handleFollowUpSubmit?: (message: string) => Promise<unknown>;
	});

// Mock fetch for tests
if (typeof globalThis.fetch === "undefined") {
	globalThis.fetch = (() =>
		Promise.resolve(new Response())) as unknown as typeof fetch;
}

// Add custom matchers if needed
expect.extend({
	toBeValidAppDescription(received: string) {
		const pass = received && received.length > 0 && received.length < 1000;
		return {
			message: () =>
				`expected ${received} to be a valid app description (length 1-1000)`,
			pass: Boolean(pass),
		};
	},

	toBeValidFileStructure(received: MockAppStructure | null | undefined) {
		const pass =
			received &&
			Array.isArray(received.files) &&
			received.files.length > 0 &&
			received.files.every(
				(file: MockFile) =>
					typeof file.path === "string" &&
					typeof file.content === "string" &&
					file.path.length > 0,
			);

		return {
			message: () =>
				`expected ${JSON.stringify(received)} to be a valid file structure`,
			pass: Boolean(pass),
		};
	},
});
