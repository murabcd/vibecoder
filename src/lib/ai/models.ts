export const modelRealtime = "RealtimeModel";
export const modelRealtimeMini = "RealtimeMiniModel";
export const modelTranscription = "TranscriptionModel";
export const modelCodeGeneration = "CodeGenerationModel";

const modelMappings: Record<string, string> = {
	[modelRealtime]: "gpt-realtime",
	[modelRealtimeMini]: "gpt-4o-mini-realtime-preview",
	[modelTranscription]: "gpt-4o-mini-transcribe",
	[modelCodeGeneration]: "gpt-4.1",
};

export function getModelId(id: string): string {
	const modelId = modelMappings[id];
	if (!modelId) {
		throw new Error(`Model id "${id}" not found in mappings.`);
	}
	return modelId;
}

export interface ModelInfo {
	id: string;
	name: string;
	description: string;
}

export const modelInfoList: Array<ModelInfo> = [
	{
		id: modelRealtime,
		name: "GPT realtime",
		description:
			"Higher quality conversational model with higher latency. Can handle complex reasoning and detailed responses with better instruction-following.",
	},
	{
		id: modelRealtimeMini,
		name: "GPT 4o mini realtime",
		description:
			"Optimized for low-latency conversational responses. Faster response times with good quality for real-time interactions.",
	},
];
