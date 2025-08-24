import { RealtimeAgent } from "@openai/agents/realtime";
import { tool } from "../agents/types";
import { createAgent } from "../lib/ai/prompts";

export const createAppAgent = new RealtimeAgent({
	name: "createApp",
	voice: "shimmer",
	instructions: createAgent,
	handoffs: [],
	tools: [
		tool({
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
				additionalProperties: false,
			},
			execute: async ({ description }: { description: string }) => {
				try {
					// Call the window function exposed by the coder component
					if (typeof window !== "undefined" && window.triggerAppGeneration) {
						await window.triggerAppGeneration(description);
						return {
							success: true,
							message: `Started creating app: "${description}". This may take a moment to generate and deploy.`,
						};
					} else {
						return {
							success: false,
							message:
								"App generation function not available. Please try again.",
						};
					}
				} catch (error) {
					console.error("Error creating app:", error);
					return {
						success: false,
						error:
							error instanceof Error ? error.message : "Unknown error occurred",
						message:
							"Failed to create app. Please try again with a clearer description.",
					};
				}
			},
		}),
	],
	handoffDescription:
		"Agent that creates new applications based on user requirements",
});
