import "../setup";
import { expect, test, describe } from "bun:test";
import {
	createAgent,
	refineAgent,
	createAppPrompt,
	refineAppPrompt,
	appNameGenerationPrompt,
} from "../../src/lib/ai/prompts";

describe("AI Prompts", () => {
	describe("createAgent prompt", () => {
		test("should contain personality and tone guidelines", () => {
			expect(createAgent).toContain("# Personality and Tone");
			expect(createAgent).toContain("## Identity");
			expect(createAgent).toContain("## Task");
			expect(createAgent).toContain("## Demeanor");
			expect(createAgent).toContain("## Tone");
		});

		test("should define create_app tool usage", () => {
			expect(createAgent).toContain("## Tool Usage");
			expect(createAgent).toContain("create_app");
			expect(createAgent).toContain("single argument");
			expect(createAgent).toContain("string description");
		});

		test("should include operational notes", () => {
			expect(createAgent).toContain("## Operational Notes");
			expect(createAgent).toContain("Create only one sandbox per session");
			expect(createAgent).toContain("Prefer standard dev ports");
			expect(createAgent).toContain("Prefer pnpm in scripts");
		});

		test("should have California developer personality traits", () => {
			expect(createAgent).toContain("California software developer");
			expect(createAgent).toContain("laid-back and funny");
			expect(createAgent).toContain("colloquialisms");
			expect(createAgent).toContain("2000s slang");
		});

		test("should define specific tool usage patterns", () => {
			expect(createAgent).toContain(
				"If the user asks you to build an app, use the create_app function",
			);
			expect(createAgent).toContain(
				"The create_app function takes a single argument",
			);
			expect(createAgent).toContain(
				"description should be a several sentences long",
			);
		});
	});

	describe("refineAgent prompt", () => {
		test("should contain personality and tone guidelines", () => {
			expect(refineAgent).toContain("# Personality and Tone");
			expect(refineAgent).toContain("## Identity");
			expect(refineAgent).toContain("## Task");
			expect(refineAgent).toContain("## Demeanor");
		});

		test("should define refine_app tool usage", () => {
			expect(refineAgent).toContain("## Tool Usage");
			expect(refineAgent).toContain("refine_app");
			expect(refineAgent).toContain("refinementMessage parameter");
		});

		test("should include operational notes for refinement", () => {
			expect(refineAgent).toContain("## Operational Notes");
			expect(refineAgent).toContain("Work with the existing sandbox");
			expect(refineAgent).toContain("Understand the current app structure");
			expect(refineAgent).toContain("Be precise with refinement instructions");
		});

		test("should maintain personality consistency", () => {
			expect(refineAgent).toContain("California developer vibe");
			expect(refineAgent).toContain("detail-oriented and methodical");
		});
	});

	describe("createAppPrompt template", () => {
		test("should have correct output format requirements", () => {
			expect(createAppPrompt).toContain("Output requirements:");
			expect(createAppPrompt).toContain("Return ONLY a single JSON object");
			expect(createAppPrompt).toContain(
				'{ "files": [ { "path": string, "content": string } ] }',
			);
		});

		test("should include file structure guidelines", () => {
			expect(createAppPrompt).toContain(
				"All file paths must be relative to the sandbox root",
			);
			expect(createAppPrompt).toContain(
				"Every file must be complete, syntactically valid",
			);
		});

		test("should include framework-specific guidance", () => {
			expect(createAppPrompt).toContain(
				"Fullstack apps (Next.js, App Router rules):",
			);
			expect(createAppPrompt).toContain(
				"Use the App Router (`app/` directory)",
			);
			expect(createAppPrompt).toContain("Prefer server components by default");
		});

		test("should include accessibility requirements", () => {
			expect(createAppPrompt).toContain("Accessibility:");
			expect(createAppPrompt).toContain("use semantic HTML");
			expect(createAppPrompt).toContain("ensure keyboard accessibility");
		});

		test("should specify package manager preferences", () => {
			expect(createAppPrompt).toContain("Prefer pnpm over npm");
			expect(createAppPrompt).toContain(
				"packageManager field for pnpm if appropriate",
			);
		});

		test("should include port configuration guidelines", () => {
			expect(createAppPrompt).toContain(
				"For Vite projects, the dev script should prefer port 5173",
			);
			expect(createAppPrompt).toContain("For Next.js, prefer port 3000");
		});
	});

	describe("refineAppPrompt template", () => {
		test("should generate correct prompt for refinement", () => {
			const existingCode =
				"<!DOCTYPE html><html><body>Hello World</body></html>";
			const userInstruction = "Add a button that says 'Click me'";

			const prompt = refineAppPrompt(existingCode, userInstruction);

			expect(prompt).toContain(
				"The user wants to modify an existing application",
			);
			expect(prompt).toContain(existingCode);
			expect(prompt).toContain(userInstruction);
			expect(prompt).toContain("return ONLY a JSON object");
			expect(prompt).toContain(
				'{ "files": [ { "path": string, "content": string } ] }',
			);
		});

		test("should handle empty existing code", () => {
			const prompt = refineAppPrompt("", "Add dark mode");

			expect(prompt).toContain(
				"Existing primary file for context (index.html):",
			);
			expect(prompt).toContain("User instruction: Add dark mode");
		});

		test("should handle complex user instructions", () => {
			const complexInstruction = `
        1. Add user authentication
        2. Implement responsive design
        3. Add error handling
        4. Optimize performance
      `;

			const prompt = refineAppPrompt("existing code", complexInstruction);
			expect(prompt).toContain(complexInstruction);
		});

		test("should include Next.js specific constraints", () => {
			const prompt = refineAppPrompt("code", "instruction");

			expect(prompt).toContain("Constraints for Next.js projects:");
			expect(prompt).toContain("Preserve the App Router structure");
			expect(prompt).toContain('Do not add "use client" to `app/layout.tsx`.');
		});

		test("should include general refinement rules", () => {
			const prompt = refineAppPrompt("code", "instruction");

			expect(prompt).toContain("General refinement rules:");
			expect(prompt).toContain(
				"Maintain compatibility with previously generated files",
			);
			expect(prompt).toContain("Prefer pnpm in any updated scripts");
		});
	});

	describe("appNameGenerationPrompt", () => {
		test("should contain app name generation guidelines", () => {
			expect(appNameGenerationPrompt).toContain("generate a short title");
			expect(appNameGenerationPrompt).toContain(
				"first message a user begins a conversation with",
			);
			expect(appNameGenerationPrompt).toContain(
				"not more than 80 characters long",
			);
			expect(appNameGenerationPrompt).toContain(
				"summary of the user's message",
			);
		});

		test("should specify formatting requirements", () => {
			expect(appNameGenerationPrompt).toContain("Do not use quotes or colons");
		});
	});

	describe("Prompt Integration", () => {
		test("should ensure consistent personality across prompts", () => {
			// All prompts should maintain the California developer personality
			expect(createAgent).toContain("California");
			expect(refineAgent).toContain("California");

			// Both should mention technical competence
			expect(createAgent).toContain("knowledgeable client");
			expect(refineAgent).toContain("methodical");
		});

		test("should ensure consistent tool usage patterns", () => {
			expect(createAgent).toContain("use the create_app function");
			expect(refineAgent).toContain("Use the refine_app function");

			expect(createAgent).toContain("tool you are going to call");
			expect(refineAgent).toContain("refinementMessage parameter");
		});

		test("should ensure consistent operational guidelines", () => {
			expect(createAgent).toContain("Prefer pnpm");
			expect(refineAgent).toContain("existing sandbox");

			expect(createAppPrompt).toContain("Prefer pnpm");
			expect(refineAppPrompt("", "")).toContain("Prefer pnpm");
		});
	});

	describe("Prompt Content Validation", () => {
		test("should not contain TODO comments or placeholders", () => {
			expect(createAgent).not.toContain("TODO");
			expect(refineAgent).not.toContain("TODO");
			expect(createAppPrompt).toContain("Do not include TODOs or placeholders");
			expect(appNameGenerationPrompt).not.toContain("TODO");
		});

		test("should not contain shell state assumptions", () => {
			const prompts = [
				createAgent,
				refineAgent,
				createAppPrompt,
				appNameGenerationPrompt,
			];

			prompts.forEach((prompt) => {
				expect(prompt).not.toContain("cd ");
				expect(prompt).not.toContain("&& ");
				expect(prompt).toContain("no chained `&&`");
			});
		});

		test("should specify correct port preferences", () => {
			expect(createAgent).toContain("Next: 3000");
			expect(createAgent).toContain("Vite: 5173");
			expect(createAgent).toContain("Avoid port 8080");

			expect(createAppPrompt).toContain("port 5173");
			expect(createAppPrompt).toContain("port 3000");
		});

		test("should include proper JSON formatting instructions", () => {
			expect(createAppPrompt).toContain("no markdown, no commentary");
			expect(createAppPrompt).toContain("exact shape");

			const refinePrompt = refineAppPrompt("", "");
			expect(refinePrompt).toContain("no markdown, no commentary");
			expect(refinePrompt).toContain("exact shape");
		});
	});
});
