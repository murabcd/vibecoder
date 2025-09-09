import "../setup";
import { expect, test, describe } from "bun:test";
import { createAppAgent } from "../../src/agents/create-app-agent";
import { refineAppAgent } from "../../src/agents/refine-app-agent";

describe("App Generation Integration", () => {
	describe("Agent Configuration", () => {
		test("should have create app agent properly configured", () => {
			expect(createAppAgent.name).toBe("createApp");
			expect(createAppAgent.voice).toBe("shimmer");
			expect(createAppAgent.tools).toHaveLength(1);
			expect(createAppAgent.tools[0].name).toBe("create_app");
			expect(createAppAgent.tools[0].description).toContain("create a new app");
		});

		test("should have refine app agent properly configured", () => {
			expect(refineAppAgent.name).toBe("refineApp");
			expect(refineAppAgent.voice).toBe("shimmer");
			expect(refineAppAgent.tools).toHaveLength(1);
			expect(refineAppAgent.tools[0].name).toBe("refine_app");
			expect(refineAppAgent.tools[0].description).toContain("refine or modify");
		});

		test("should have proper tool parameters", () => {
			const createTool = createAppAgent.tools[0];
			expect(createTool.parameters.required).toContain("description");
			expect(createTool.parameters.properties.description.type).toBe("string");

			const refineTool = refineAppAgent.tools[0];
			expect(refineTool.parameters.required).toContain("refinementMessage");
			expect(refineTool.parameters.properties.refinementMessage.type).toBe("string");
		});

		test("should have agent handoff descriptions", () => {
			expect(createAppAgent.handoffDescription).toContain("creates new applications");
			expect(refineAppAgent.handoffDescription).toContain("refines and modifies");
		});
	});

	describe("Tool Structure", () => {
		test("should have tools with correct function type", () => {
			expect(createAppAgent.tools[0].type).toBe("function");
			expect(refineAppAgent.tools[0].type).toBe("function");
		});

		test("should have tools with invoke method", () => {
			expect(typeof createAppAgent.tools[0].invoke).toBe("function");
			expect(typeof refineAppAgent.tools[0].invoke).toBe("function");
		});

		test("should have proper parameter schemas", () => {
			const createTool = createAppAgent.tools[0];
			expect(createTool.parameters.type).toBe("object");
			expect(createTool.parameters.additionalProperties).toBe(false);
			expect(createTool.strict).toBe(true);

			const refineTool = refineAppAgent.tools[0];
			expect(refineTool.parameters.type).toBe("object");
			expect(refineTool.parameters.additionalProperties).toBe(false);
			expect(refineTool.strict).toBe(true);
		});
	});
});