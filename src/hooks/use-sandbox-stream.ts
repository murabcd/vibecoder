import { useState, useCallback } from "react";
import type { SandboxEvent } from "@/lib/sandbox";

interface SandboxStreamState {
	isLoading: boolean;
	progress: number;
	message: string;
	result: { sandboxId: string; url: string; port: number } | null;
	error: string | null;
}

interface SandboxPayload {
	files: Array<{ path: string; content: string }>;
	timeout?: number;
	ports?: number[];
}

interface UseSandboxStreamReturn {
    state: SandboxStreamState;
    startSandbox: (payload: SandboxPayload) => Promise<void>;
    reset: () => void;
}

export function useSandboxStream(): UseSandboxStreamReturn {
	const [state, setState] = useState<SandboxStreamState>({
		isLoading: false,
		progress: 0,
		message: "",
		result: null,
		error: null,
	});

	const startSandbox = useCallback(async (payload: SandboxPayload) => {
		setState({
			isLoading: true,
			progress: 0,
			message: "Initializing...",
			result: null,
			error: null,
		});

		// Create AbortController for cleanup
		const abortController = new AbortController();

		try {
			// Call the streaming endpoint
			const response = await fetch("/api/sandbox/stream", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
				signal: abortController.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("No response body reader available");
			}

			const decoder = new TextDecoder();
			let buffer = "";

			try {
				while (true) {
					const { value, done } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || ""; // Keep incomplete line in buffer

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							try {
								const event: SandboxEvent = JSON.parse(line.slice(6));

								switch (event.type) {
									case "status":
										setState((prev) => ({
											...prev,
											progress: event.progress || prev.progress,
											message: event.message,
										}));
										break;

									case "complete":
										setState((prev) => ({
											...prev,
											isLoading: false,
											progress: 100,
											message: "Sandbox ready!",
											result: event.result,
										}));
										return; // Exit the function

									case "error":
										setState((prev) => ({
											...prev,
											isLoading: false,
											error: event.error,
											message: "Error creating sandbox",
										}));
										return; // Exit the function
								}
							} catch {
								console.warn("Failed to parse SSE event:", line);
							}
						}
					}
				}
			} finally {
				// Always clean up the reader
				reader.releaseLock();
			}
		} catch (error) {
			// Don't set error state if the request was aborted
			if (error instanceof Error && error.name === "AbortError") {
				return;
			}
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : "Unknown error",
				message: "Failed to create sandbox",
			}));
		}

    // No cleanup return; request completes or errors above.
}, []);

	const reset = useCallback(() => {
		setState({
			isLoading: false,
			progress: 0,
			message: "",
			result: null,
			error: null,
		});
	}, []);

	return { state, startSandbox, reset };
}
