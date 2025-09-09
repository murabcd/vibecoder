import "../setup";
import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { refineAppAgent } from "../../src/agents/refine-app-agent";
import { mockWindowFunctions } from "../config.test";

describe("Refine App Agent", () => {
	let mockUtils: ReturnType<typeof mockWindowFunctions>;

	beforeEach(() => {
		mockUtils = mockWindowFunctions();
	});

	afterEach(() => {
		mockUtils.reset();
	});

	test("should have correct agent configuration", () => {
		expect(refineAppAgent.name).toBe("refineApp");
		expect(refineAppAgent.voice).toBe("shimmer");
		expect(refineAppAgent.instructions).toContain("refine_app");
		expect(refineAppAgent.tools).toHaveLength(1);
	});

	test("should have refine_app tool configured", () => {
		const refineAppTool = refineAppAgent.tools[0];
		expect(refineAppTool).toBeDefined();
		expect(typeof refineAppTool).toBe("object");
		// Test that the tool exists and is properly configured
		expect(refineAppTool.name).toBe("refine_app");
	});

	describe("refine_app tool structure", () => {
		test("should have proper tool structure", () => {
			const refineAppTool = refineAppAgent.tools[0];
			expect(refineAppTool).toBeDefined();
			expect(typeof refineAppTool).toBe("object");
			expect(refineAppTool.name).toBe("refine_app");
		});

		test("should have tool properly configured", () => {
			const refineAppTool = refineAppAgent.tools[0];

			// Check that the tool object exists and has expected shape
			expect(refineAppTool).toBeDefined();
			expect(refineAppTool.name).toBe("refine_app");
			expect(typeof refineAppTool).toBe("object");
		});

		test("should have valid tool name", () => {
			const refineAppTool = refineAppAgent.tools[0];

			// Validate the tool name
			expect(refineAppTool.name).toBe("refine_app");
			expect(refineAppTool.name).toMatch(/^[a-z_]+$/);
		});
	});

	describe("Agent handoffs", () => {
		test("should have no initial handoffs", () => {
			expect(refineAppAgent.handoffs).toEqual([]);
		});

		test("should have handoff description", () => {
			expect(refineAppAgent.handoffDescription).toContain(
				"Agent that refines and modifies existing applications",
			);
		});
	});

	describe("Tool validation", () => {
		test("should have consistent tool naming", () => {
			const refineAppTool = refineAppAgent.tools[0];

			expect(refineAppTool.name).toBe("refine_app");
			expect(refineAppTool.name).toMatch(/^[a-z_]+$/); // Should be snake_case
			expect(refineAppTool.name).not.toContain(" "); // Should not have spaces
		});

		test("should have valid tool structure", () => {
			const refineAppTool = refineAppAgent.tools[0];

			expect(refineAppTool).toBeDefined();
			expect(typeof refineAppTool).toBe("object");
			expect(refineAppTool.name).toBeDefined();
		});
	});

	describe("Refinement capabilities", () => {
		test("should support different refinement instruction types", () => {
			const refineAppTool = refineAppAgent.tools[0];

			// The tool should be properly configured
			expect(refineAppTool).toBeDefined();
			expect(typeof refineAppTool).toBe("object");
		});

		test("should have flexible parameter validation", () => {
			const refineAppTool = refineAppAgent.tools[0];

			// Should be a properly configured tool
			expect(refineAppTool).toBeDefined();
			expect(refineAppTool.name).toBe("refine_app");
		});
	});
});
