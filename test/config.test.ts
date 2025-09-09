import "./setup";
import { expect, test, describe } from "bun:test";

// Test configuration and utilities
export const testConfig = {
	timeout: 30000, // 30 seconds for integration tests
	retries: 2,
};

// Mock utilities for testing
export const createMockFile = (path: string, content: string) => ({
	path,
	content,
});

export const createMockAppFiles = () => [
	createMockFile(
		"index.html",
		"<!DOCTYPE html><html><body>Hello World</body></html>",
	),
	createMockFile("package.json", '{"name": "test-app", "version": "1.0.0"}'),
	createMockFile("src/main.js", "console.log('Hello from test app');"),
];

export const mockWindowFunctions = () => {
	let triggerAppGenerationCalled = false;
	let handleFollowUpSubmitCalled = false;
	let lastDescription = "";
	let lastRefinement = "";

	const mockTriggerAppGeneration = async (description: string) => {
		triggerAppGenerationCalled = true;
		lastDescription = description;
		// Return void to match expected signature
	};

	const mockHandleFollowUpSubmit = async (refinement: string) => {
		handleFollowUpSubmitCalled = true;
		lastRefinement = refinement;
		// Return void to match expected signature
	};

	// Ensure window object exists and assign mock functions
	if (!globalThis.window) {
		globalThis.window = {} as any;
	}

	globalThis.window.triggerAppGeneration = mockTriggerAppGeneration;
	globalThis.window.handleFollowUpSubmit = mockHandleFollowUpSubmit;

	return {
		getTriggerAppGenerationCalled: () => triggerAppGenerationCalled,
		getHandleFollowUpSubmitCalled: () => handleFollowUpSubmitCalled,
		getLastDescription: () => lastDescription,
		getLastRefinement: () => lastRefinement,
		reset: () => {
			triggerAppGenerationCalled = false;
			handleFollowUpSubmitCalled = false;
			lastDescription = "";
			lastRefinement = "";
		},
	};
};

describe("Test Configuration", () => {
	test("should have valid test config", () => {
		expect(testConfig.timeout).toBeGreaterThan(0);
		expect(testConfig.retries).toBeGreaterThanOrEqual(0);
	});

	test("should create valid mock files", () => {
		const mockFile = createMockFile("test.txt", "test content");
		expect(mockFile.path).toBe("test.txt");
		expect(mockFile.content).toBe("test content");
	});

	test("should create valid mock app files", () => {
		const files = createMockAppFiles();
		expect(files).toHaveLength(3);
		expect(files[0].path).toBe("index.html");
		expect(files[1].path).toBe("package.json");
		expect(files[2].path).toBe("src/main.js");
	});
});
