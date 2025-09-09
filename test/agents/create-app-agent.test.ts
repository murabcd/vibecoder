import "../setup";
import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { createAppAgent } from "../../src/agents/create-app-agent";
import { mockWindowFunctions } from "../config.test";

describe("Create App Agent", () => {
	let mockUtils: ReturnType<typeof mockWindowFunctions>;

	beforeEach(() => {
		mockUtils = mockWindowFunctions();
	});

	afterEach(() => {
		mockUtils.reset();
	});

	test("should have correct agent configuration", () => {
		expect(createAppAgent.name).toBe("createApp");
		expect(createAppAgent.voice).toBe("shimmer");
		expect(createAppAgent.instructions).toContain("create_app");
		expect(createAppAgent.tools).toHaveLength(1);
	});

	test("should have create_app tool configured", () => {
		const createAppTool = createAppAgent.tools[0];
		expect(createAppTool).toBeDefined();
		expect(typeof createAppTool).toBe("object");
		// Test that the tool exists and is properly configured
		expect(createAppTool.name).toBe("create_app");
	});

	describe("create_app tool structure", () => {
		test("should have proper tool structure", () => {
			const createAppTool = createAppAgent.tools[0];
			expect(createAppTool).toBeDefined();
			expect(typeof createAppTool).toBe("object");
			expect(createAppTool.name).toBe("create_app");
		});

		test("should have tool properly configured", () => {
			const createAppTool = createAppAgent.tools[0];

			// Check that the tool object exists and has expected shape
			expect(createAppTool).toBeDefined();
			expect(createAppTool.name).toBe("create_app");
			expect(typeof createAppTool).toBe("object");
		});

		test("should have valid tool name", () => {
			const createAppTool = createAppAgent.tools[0];

			// Validate the tool name
			expect(createAppTool.name).toBe("create_app");
			expect(createAppTool.name).toMatch(/^[a-z_]+$/);
		});
	});

	describe("Agent handoffs", () => {
		test("should have no initial handoffs", () => {
			expect(createAppAgent.handoffs).toEqual([]);
		});

		test("should have handoff description", () => {
			expect(createAppAgent.handoffDescription).toContain(
				"Agent that creates new applications",
			);
		});
	});

	describe("Tool validation", () => {
		test("should have consistent tool naming", () => {
			const createAppTool = createAppAgent.tools[0];

			expect(createAppTool.name).toBe("create_app");
			expect(createAppTool.name).toMatch(/^[a-z_]+$/); // Should be snake_case
			expect(createAppTool.name).not.toContain(" "); // Should not have spaces
		});

		test("should have valid tool structure", () => {
			const createAppTool = createAppAgent.tools[0];

			expect(createAppTool).toBeDefined();
			expect(typeof createAppTool).toBe("object");
			expect(createAppTool.name).toBeDefined();
		});
	});
});
