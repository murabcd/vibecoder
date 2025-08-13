import { useState, useRef, useCallback, useEffect } from "react";
import { Session } from "@/lib/session";

interface VibeCoderSessionParams {
	instructions: string;
	model: string;
	voice: string;
	tools: Array<{
		type: string;
		name: string;
		description: string;
		parameters: unknown;
	}>;
}

interface UseVoiceSessionProps {
	openAIApiKey: string;
	sessionParams: VibeCoderSessionParams;
	onStatusUpdate: (status: string) => void;
	onTranscriptReceived: (transcript: string, isFinal: boolean) => void;
	onFunctionCallArguments: (name: string, args: unknown) => void;
	onConnectionStateChange: (state: RTCPeerConnectionState) => void;
	onError: (error: unknown) => void;
}

export function useVoiceSession({
	openAIApiKey,
	sessionParams,
	onStatusUpdate,
	onTranscriptReceived,
	onFunctionCallArguments,
	onConnectionStateChange,
	onError,
}: UseVoiceSessionProps) {
	const [isListening, setIsListening] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const sessionRef = useRef<Session | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const stopSessionInternal = useCallback(() => {
		if (sessionRef.current) {
			sessionRef.current.stop();
			sessionRef.current = null;
		}
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.srcObject = null;
		}
		setIsListening(false);
		setIsMuted(false);
		onStatusUpdate("Voice session stopped. Ready to start.");
	}, [onStatusUpdate]);

	const startListening = useCallback(async () => {
		if (!openAIApiKey) {
			onError(new Error("OpenAI API Key is not configured."));
			onStatusUpdate("Error: API Key not configured.");
			return;
		}
		if (sessionRef.current) return;

		try {
			onStatusUpdate("Initializing audio stream...");
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			onStatusUpdate("Starting voice session...");
			const newSession = new Session(openAIApiKey);
			sessionRef.current = newSession;

			newSession.onopen = () => {
				onStatusUpdate("Voice session connected. Listening...");
				setIsListening(true);
				newSession.sendMessage({ type: "response.create" });
			};

			type SessionMessage = {
				type: string;
				is_final?: boolean;
				transcript?: string;
				name?: string;
				arguments?: string;
			};

			newSession.onmessage = (msg: SessionMessage) => {
				if (msg.type === "transcript") {
					onTranscriptReceived(msg.transcript || "", msg.is_final || false);
				}
				if (msg.type === "response.function_call_arguments.done" && msg.name) {
					try {
						const args = JSON.parse(msg.arguments as string);
						onFunctionCallArguments(msg.name, args);
					} catch (_e) {
						onError(new Error("Error processing AI command arguments."));
					}
				}
			};

			newSession.ontrack = (e: RTCTrackEvent) => {
				if (!audioRef.current) {
					audioRef.current = new Audio();
				}
				if (e.streams?.[0]) {
					audioRef.current.srcObject = e.streams[0];
					audioRef.current.play().catch((err) => {
						onError(err);
					});
				}
			};

			newSession.onerror = (err: unknown) => {
				onError(err);
				stopSessionInternal();
			};

			newSession.onconnectionstatechange = (state: RTCPeerConnectionState) => {
				onConnectionStateChange(state);
				if (
					state === "failed" ||
					state === "closed" ||
					state === "disconnected"
				) {
					stopSessionInternal();
				}
			};

			await newSession.start(stream, sessionParams);
		} catch (error) {
			const msg =
				error instanceof Error
					? error.message
					: "Unknown error starting voice session";
			onStatusUpdate(`Error: ${msg}`);
			setIsListening(false);
			onError(error);
		}
	}, [
		openAIApiKey,
		sessionParams,
		onStatusUpdate,
		onTranscriptReceived,
		onFunctionCallArguments,
		onConnectionStateChange,
		onError,
		stopSessionInternal,
	]);

	const stopListening = useCallback(() => {
		stopSessionInternal();
	}, [stopSessionInternal]);

	const toggleMute = useCallback(() => {
		if (sessionRef.current && isListening) {
			const newMutedState = !isMuted;
			sessionRef.current.setMuted(newMutedState);
			setIsMuted(newMutedState);
			onStatusUpdate(newMutedState ? "Microphone muted" : "Microphone unmuted");
		}
	}, [isMuted, isListening, onStatusUpdate]);

	useEffect(() => {
		return () => {
			stopSessionInternal();
		};
	}, [stopSessionInternal]);

	return {
		isListening,
		isMuted,
		startListening,
		stopListening,
		toggleMute,
		audioRef,
	};
}
