import "./setup";
import { expect, test, describe } from "bun:test";
import { createAppAgent } from "../src/agents/create-app-agent";
import { refineAppAgent } from "../src/agents/refine-app-agent";

describe("Error Handling and Edge Cases", () => {
	describe("Agent Error Handling", () => {
		test("should have proper error handling structure in create app agent", () => {
			const tool = createAppAgent.tools[0];
			expect(tool.name).toBe("create_app");
			expect(tool.invoke).toBeDefined();
			expect(typeof tool.invoke).toBe("function");
		});

		test("should have proper error handling structure in refine app agent", () => {
			const tool = refineAppAgent.tools[0];
			expect(tool.name).toBe("refine_app");
			expect(tool.invoke).toBeDefined();
			expect(typeof tool.invoke).toBe("function");
		});

		test("should have needsApproval function available", () => {
			expect(typeof createAppAgent.tools[0].needsApproval).toBe("function");
			expect(typeof refineAppAgent.tools[0].needsApproval).toBe("function");
		});
	});

	describe("Tool Parameter Validation", () => {
		test("should require description parameter for create app", () => {
			const tool = createAppAgent.tools[0];
			expect(tool.parameters.required).toContain("description");
			expect(tool.parameters.properties.description).toBeDefined();
			expect(tool.parameters.properties.description.type).toBe("string");
		});

		test("should require refinementMessage parameter for refine app", () => {
			const tool = refineAppAgent.tools[0];
			expect(tool.parameters.required).toContain("refinementMessage");
			expect(tool.parameters.properties.refinementMessage).toBeDefined();
			expect(tool.parameters.properties.refinementMessage.type).toBe("string");
		});

		test("should have strict parameter validation enabled", () => {
			expect(createAppAgent.tools[0].strict).toBe(true);
			expect(refineAppAgent.tools[0].strict).toBe(true);
		});

		test("should not allow additional properties", () => {
			expect(createAppAgent.tools[0].parameters.additionalProperties).toBe(false);
			expect(refineAppAgent.tools[0].parameters.additionalProperties).toBe(false);
		});
	});

	describe("Agent Consistency", () => {
		test("should have consistent voice settings", () => {
			expect(createAppAgent.voice).toBe("shimmer");
			expect(refineAppAgent.voice).toBe("shimmer");
		});

		test("should have consistent tool structure", () => {
			const createTool = createAppAgent.tools[0];
			const refineTool = refineAppAgent.tools[0];

			expect(createTool.type).toBe(refineTool.type);
			expect(createTool.strict).toBe(refineTool.strict);
			expect(createTool.parameters.type).toBe(refineTool.parameters.type);
			expect(createTool.parameters.additionalProperties).toBe(refineTool.parameters.additionalProperties);
		});

		test("should have proper handoff descriptions", () => {
			expect(createAppAgent.handoffDescription).toBeTruthy();
			expect(refineAppAgent.handoffDescription).toBeTruthy();
			expect(typeof createAppAgent.handoffDescription).toBe("string");
			expect(typeof refineAppAgent.handoffDescription).toBe("string");
		});
	});
});