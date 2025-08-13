import { createServerFn } from "@tanstack/react-start";
import { OpenAI } from "openai";

import { env } from "@/env";
import { vibeCoderPrompt, appGenerationPrompt } from "@/lib/ai/prompts";
import { getModelId, modelChat, modelRealtimeMini } from "@/lib/ai/models";
import { SandboxFilesPayloadSchema } from "@/lib/sandbox";

export function isNetworkError(error: Error): boolean {
	const networkErrors = [
		"econnreset",
		"econnrefused",
		"etimedout",
		"enotfound",
		"fetch failed",
		"timeout",
		"aborted",
	];
	const cause = error.cause as { code?: string; errno?: number } | undefined;
	return networkErrors.some(
		(errType) =>
			error.message.toLowerCase().includes(errType.toLowerCase()) ||
			cause?.code === errType ||
			cause?.errno === -54 ||
			error.name === "AbortError",
	);
}

export const vibeCoderSessionParams = {
	instructions: vibeCoderPrompt,
	model: getModelId(modelRealtimeMini),
	voice: "shimmer",
	tools: [
		{
			type: "function",
			name: "create_app",
			description:
				"Use this function to create a new app with the given description.",
			parameters: {
				type: "object",
				properties: {
					description: {
						type: "string",
						description: "The description of the app to create.",
					},
				},
				required: ["description"],
			},
		},
	],
};

export const generateAppOnServer = createServerFn({ method: "POST" })
	.validator((appDescription: string): string => {
		if (typeof appDescription !== "string" || appDescription.trim() === "") {
			throw new Error("App description cannot be empty.");
		}
		return appDescription;
	})
	.handler(async ({ data: appDescription }: { data: string }) => {
		if (!env.OPENAI_API_KEY) {
			throw new Error(
				"OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file.",
			);
		}
		const client = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});

		const maxRetries = 3;
		const baseDelay = 2000;
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const stream = await client.responses.create({
					model: getModelId(modelChat),
					input: [
						{ role: "system", content: appGenerationPrompt },
						{ role: "user", content: appDescription },
					],
					stream: true,
				});

				let accumulatedContent = "";

				for await (const event of stream) {
					// Handle different event types from Responses API
					if (event.type === "response.output_text.delta") {
						const content = event.delta;
						if (content) {
							accumulatedContent += content;
						}
					} else if (event.type === "response.completed") {
						break;
					} else if (event.type === "response.failed") {
						throw new Error(`Response failed: ${JSON.stringify(event)}`);
					} else if (event.type === "error") {
						throw new Error(`Stream error: ${JSON.stringify(event)}`);
					}
				}

				// Parse the final accumulated content
				if (!accumulatedContent.trim()) {
					throw new Error("No content received from OpenAI Responses API");
				}

				// Expect a pure JSON object. Strip code fences if present, then parse and validate.
				const jsonString = accumulatedContent
					.replace(/^```(?:json)?\n|\n?```$/g, "")
					.trim();
				const parsed = JSON.parse(jsonString);
				const filesObject = SandboxFilesPayloadSchema.parse(parsed);
				return filesObject;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				console.error(
					`❌ AI generation attempt ${attempt} failed:`,
					lastError.message,
				);

				// Classify the error
				const isApiAuth =
					lastError.message.includes("401") ||
					lastError.message.includes("403");
				const isRateLimit = lastError.message.includes("429");
				const isParsingError =
					lastError.message.includes("Invalid API response format") ||
					lastError.message.includes("JSON");

				// Don't retry on certain errors
				if (isApiAuth || isParsingError) {
					throw lastError;
				}

				// For rate limits, wait longer
				if (isRateLimit) {
					await new Promise((resolve) => setTimeout(resolve, 5000));
				}

				// If this was the last attempt, throw the error
				if (attempt === maxRetries) {
					throw lastError;
				}

				// Wait before retrying with exponential backoff
				const delay = baseDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		throw (
			lastError ||
			new Error("An unexpected error occurred while generating the app.")
		);
	});
