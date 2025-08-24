import { RealtimeAgent } from "@openai/agents/realtime";
import { tool } from "../agents/types";
import { refineAgent } from "../lib/ai/prompts";

export const refineAppAgent = new RealtimeAgent({
	name: "refineApp",
	voice: "shimmer",
	instructions: refineAgent,
	handoffs: [],
	tools: [
		tool({
			name: "refine_app",
			description:
				"Use this function to refine or modify an existing app based on user instructions.",
			parameters: {
				type: "object",
				properties: {
					refinementMessage: {
						type: "string",
						description:
							"The instructions for how to refine or modify the app.",
					},
				},
				required: ["refinementMessage"],
				additionalProperties: false,
			},
			execute: async ({ refinementMessage }: { refinementMessage: string }) => {
				try {
					// Call the window function exposed by the coder component
					if (typeof window !== "undefined" && window.handleFollowUpSubmit) {
						await window.handleFollowUpSubmit(refinementMessage);
						return {
							success: true,
							message: `Started refining app: "${refinementMessage}". This may take a moment to process and update.`,
						};
					} else {
						return {
							success: false,
							message:
								"App refinement function not available. Please try again.",
						};
					}
				} catch (error) {
					console.error("Error refining app:", error);
					return {
						success: false,
						error:
							error instanceof Error ? error.message : "Unknown error occurred",
						message:
							"Failed to refine app. Please try again with more specific instructions.",
					};
				}
			},
		}),
	],
	handoffDescription:
		"Agent that refines and modifies existing applications based on user feedback",
});
