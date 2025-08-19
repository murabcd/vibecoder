export const modelRealtime = "RealtimeModel";
export const modelRealtimeMini = "RealtimeMiniModel";
export const modelChat = "ChatModel";
export const modelChatMini = "ChatMiniModel";

const modelMappings: Record<string, string> = {
	[modelRealtime]: "gpt-4o-mini-realtime-preview",
	[modelRealtimeMini]: "gpt-4o-realtime-preview",
	[modelChat]: "gpt-4.1",
	[modelChatMini]: "gpt-4.1-mini",
};

export function getModelId(id: string): string {
	const modelId = modelMappings[id];
	if (!modelId) {
		throw new Error(`Model id "${id}" not found in mappings.`);
	}
	return modelId;
}

interface ModelInfo {
	id: string;
	name: string;
	description: string;
	strengths: string[];
}

export const modelInfoList: Array<ModelInfo> = [
	{
		id: modelRealtime,
		name: "GPT-4o realtime preview",
		description:
			"Higher quality conversational model with higher latency. Can handle complex reasoning and detailed responses with better instruction-following.",
		strengths: [
			"Complex reasoning",
			"Detailed responses",
			"Better instruction-following",
			"Higher quality output",
		],
	},
	{
		id: modelRealtimeMini,
		name: "GPT-4o mini realtime preview",
		description:
			"Optimized for low-latency conversational responses. Faster response times with good quality for real-time interactions.",
		strengths: [
			"Low latency",
			"Fast responses",
			"Real-time interactions",
			"Good quality",
		],
	},
];
