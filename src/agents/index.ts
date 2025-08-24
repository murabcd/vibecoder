import { createAppAgent } from "./create-app-agent";
import { refineAppAgent } from "./refine-app-agent";
import type { RealtimeAgent } from "@openai/agents/realtime";

createAppAgent.handoffs = [refineAppAgent];
refineAppAgent.handoffs = [createAppAgent];

export const vibeCoderScenario: RealtimeAgent[] = [
	createAppAgent,
	refineAppAgent,
];

export const allAgentSets: Record<string, RealtimeAgent[]> = {
	vibeCoder: vibeCoderScenario,
};

export const defaultAgentSetKey = "vibeCoder";
