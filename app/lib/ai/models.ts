export const modelRealtime = "RealtimeModel";
export const modelRealtimeMini = "RealtimeMiniModel";
export const modelChat = "ChatModel";
export const modelChatMini = "ChatMiniModel";
export const modelTranscribe = "TranscriptionModel";
export const modelTranscribeMini = "TranscriptionMiniModel";

const modelMappings: Record<string, string> = {
  [modelRealtime]: "gpt-4o-mini-realtime-preview",
  [modelRealtimeMini]: "gpt-4o-realtime-preview",
  [modelChat]: "gpt-4.1",
  [modelChatMini]: "gpt-4.1-mini",
  [modelTranscribe]: "gpt-4o-transcribe",
  [modelTranscribeMini]: "gpt-4o-mini-transcribe",
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
}

export const modelInfoList: Array<ModelInfo> = [
  {
    id: modelRealtime,
    name: "GPT-4o realtime preview",
    description: "Higher quality conversational model with higher latency",
  },
  {
    id: modelRealtimeMini,
    name: "GPT-4o mini realtime preview",
    description: "Optimized for low-latency conversational responses",
  },
  {
    id: modelChat,
    name: "GPT-4.1",
    description: "General purpose GPT-4.1 model",
  },
  {
    id: modelChatMini,
    name: "GPT-4.1 mini",
    description: "Smaller variant of GPT-4.1",
  },
  {
    id: modelTranscribe,
    name: "GPT-4o transcribe",
    description: "Optimized for speech-to-text transcription",
  },
  {
    id: modelTranscribeMini,
    name: "GPT-4o mini transcribe",
    description: "Optimized for low-latency speech-to-text transcription",
  },
];
