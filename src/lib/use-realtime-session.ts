import { useCallback, useRef, useState, useEffect } from "react";
import {
	RealtimeSession,
	type RealtimeAgent,
	OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
import {
	getModelId,
	modelRealtimeMini,
	modelTranscription,
} from "@/lib/ai/models";
import type { SessionStatus } from "@/types";

type ExtendedSessionStatus = SessionStatus | "RECONNECTING";

export interface RealtimeSessionCallbacks {
	onConnectionChange?: (status: ExtendedSessionStatus) => void;
	onAgentHandoff?: (agentName: string) => void;
}

export interface ConnectOptions {
	getEphemeralKey: () => Promise<string>;
	initialAgents: RealtimeAgent[];
	audioElement?: HTMLAudioElement;
	extraContext?: Record<string, any>;
	outputGuardrails?: any[];
}

export function useRealtimeSession(callbacks: RealtimeSessionCallbacks = {}) {
	const sessionRef = useRef<RealtimeSession | null>(null);
	const [status, setStatus] = useState<ExtendedSessionStatus>("DISCONNECTED");

	const updateStatus = useCallback(
		(s: ExtendedSessionStatus) => {
			setStatus(s);
			callbacks.onConnectionChange?.(s);
		},
		[callbacks],
	);

	const handleAgentHandoff = useCallback(
		(item: any) => {
			const history = item.context.history;
			const lastMessage = history[history.length - 1];
			const agentName = lastMessage.name.split("transfer_to_")[1];
			callbacks.onAgentHandoff?.(agentName);
		},
		[callbacks],
	);

	useEffect(() => {
		if (sessionRef.current) {
			// Log server errors with more detail
			sessionRef.current.on("error", (...args: any[]) => {
				console.error("Session error details:", {
					error: args[0],
					allArgs: args,
					timestamp: new Date().toISOString(),
				});
			});

			// Agent handoff events
			sessionRef.current.on("agent_handoff", handleAgentHandoff);
		}
	}, [handleAgentHandoff]);

	const connect = useCallback(
		async ({
			getEphemeralKey,
			initialAgents,
			audioElement,
			extraContext,
			outputGuardrails,
		}: ConnectOptions) => {
			if (sessionRef.current) return;

			updateStatus("CONNECTING");

			try {
				const ek = await getEphemeralKey();
				const rootAgent = initialAgents[0];

				sessionRef.current = new RealtimeSession(rootAgent, {
					transport: new OpenAIRealtimeWebRTC({
						audioElement,
					}),
					model: getModelId(modelRealtimeMini),
					config: {
						inputAudioFormat: "pcm16",
						outputAudioFormat: "pcm16",
						inputAudioTranscription: {
							model: getModelId(modelTranscription),
						},
					},
					outputGuardrails: outputGuardrails ?? [],
					context: extraContext ?? {},
				});

				await sessionRef.current.connect({ apiKey: ek });
				updateStatus("CONNECTED");
			} catch (error) {
				console.error("Failed to connect - detailed error:", {
					error,
					message: error instanceof Error ? error.message : "Unknown error",
					stack: error instanceof Error ? error.stack : "No stack trace",
					timestamp: new Date().toISOString(),
				});
				updateStatus("DISCONNECTED");
				throw error;
			}
		},
		[updateStatus],
	);

	const disconnect = useCallback(() => {
		sessionRef.current?.close();
		sessionRef.current = null;
		updateStatus("DISCONNECTED");
	}, [updateStatus]);

	const assertconnected = useCallback(() => {
		if (!sessionRef.current) throw new Error("RealtimeSession not connected");
	}, []);

	/* ----------------------- message helpers ------------------------- */

	const interrupt = useCallback(() => {
		sessionRef.current?.interrupt();
	}, []);

	const sendUserText = useCallback(
		(text: string) => {
			assertconnected();
			sessionRef.current?.sendMessage(text);
		},
		[assertconnected],
	);

	const sendEvent = useCallback((ev: any) => {
		sessionRef.current?.transport.sendEvent(ev);
	}, []);

	const mute = useCallback((m: boolean) => {
		sessionRef.current?.mute(m);
	}, []);

	const pushToTalkStart = useCallback(() => {
		if (!sessionRef.current) return;
		sessionRef.current.transport.sendEvent({
			type: "input_audio_buffer.clear",
		} as any);
	}, []);

	const pushToTalkStop = useCallback(() => {
		if (!sessionRef.current) return;
		sessionRef.current.transport.sendEvent({
			type: "input_audio_buffer.commit",
		} as any);
		sessionRef.current.transport.sendEvent({ type: "response.create" } as any);
	}, []);

	return {
		status,
		connect,
		disconnect,
		sendUserText,
		sendEvent,
		mute,
		pushToTalkStart,
		pushToTalkStop,
		interrupt,
	} as const;
}
