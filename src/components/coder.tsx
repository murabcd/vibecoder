import { useState, useCallback } from "react";

import { useVoiceSession } from "@/hooks/use-voice-session";

import { appRefinemenPrompt } from "@/lib/ai/prompts";
import { vibeCoderSessionParams, generateAppOnServer } from "@/lib/ai/ai";

import Header from "@/components/header";
import CodePreview from "@/components/code-preview";
import CodeInstruct from "@/components/code-instruct";
import MobileCodeDrawer from "@/components/mobile-code-drawer";
import type { ConsoleOutput } from "@/components/console";
import {
	getSandboxUrlOnServer,
	updateSandboxFilesOnServer,
	initSandboxWithFilesOnServer,
} from "@/lib/sandbox";

export default function VibeCoder() {
	const [status, setStatus] = useState(
		"Click the voice button to start coding.",
	);
	const [currentAppDescription, setCurrentAppDescription] = useState("");
	const [followUpText, setFollowUpText] = useState("");
	const [generatedAppCode, setGeneratedAppCode] = useState<string | null>(null);
	const [isGeneratingCode, setIsGeneratingCode] = useState(false);
	const [displayMode, setDisplayMode] = useState<"preview" | "code">("preview");
	// keep error state for potential UI rendering later
	const [, setError] = useState<string | null>(null);
	const [isMobileCodeDrawerOpen, setIsMobileCodeDrawerOpen] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	// store sandboxId to reuse the same sandbox across refinements
	const [sandboxId, setSandboxId] = useState<string | null>(null);
	const [generatedFiles, setGeneratedFiles] = useState<
		Array<{ path: string; content: string }>
	>([]);
	const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

	// managed by the voice session hook
	const [consoleOutputs, setConsoleOutputs] = useState<Array<ConsoleOutput>>(
		[],
	);

	const appendToConsole = useCallback(
		(
			type: ConsoleOutput["contents"][0]["type"],
			value: string,
			consoleStatus: ConsoleOutput["status"] = "completed",
		) => {
			setConsoleOutputs((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					status: consoleStatus,
					contents: [{ type, value }],
				},
			]);
		},
		[],
	);

	const handleClearConsole = useCallback(() => {
		setConsoleOutputs([]);
	}, []);

	const handleOpenMobileCodeDrawer = useCallback(() => {
		setIsMobileCodeDrawerOpen(true);
	}, []);

	const handleCloseMobileCodeDrawer = useCallback(() => {
		setIsMobileCodeDrawerOpen(false);
	}, []);

	const triggerAppGeneration = useCallback(
		async (description: string) => {
			if (!description.trim()) {
				setStatus("App description cannot be empty.");
				appendToConsole("error", "App description cannot be empty.", "failed");
				return;
			}
			setStatus("Generating your app...");
			setIsGeneratingCode(true);
			setGeneratedAppCode(null);
			setPreviewUrl(null);
			setFollowUpText("");
			setError(null);
			appendToConsole("info", "App generation initiated.");

			try {
				const filesObject = await generateAppOnServer({ data: description });

				// Start sandbox creation
				appendToConsole(
					"info",
					"App generated successfully. Launching sandbox...",
				);

				// Create sandbox with files
				const { url, sandboxId } = await initSandboxWithFilesOnServer({
					data: filesObject,
				});

				// Populate code view with index.html if available; otherwise fallback to JSON
				setGeneratedFiles(
					filesObject.files as Array<{ path: string; content: string }>,
				);
				const indexHtml = filesObject.files.find((f: { path: string }) =>
					/(^|\/)index\.html$/i.test(f.path),
				);
				if (indexHtml && typeof indexHtml.content === "string") {
					setGeneratedAppCode(indexHtml.content);
					setSelectedFilePath(indexHtml.path);
				} else {
					setGeneratedAppCode(JSON.stringify(filesObject, null, 2));
					setSelectedFilePath(filesObject.files?.[0]?.path ?? null);
				}
				setPreviewUrl(url);
				setSandboxId(sandboxId);
				setStatus("App generated successfully! Previewing now.");
				appendToConsole("info", `Sandbox ready at ${url}`);
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Unknown error";
				setStatus(`Error generating app: ${msg}`);
				setError(msg);
				appendToConsole("error", `Error generating app: ${msg}`, "failed");
			} finally {
				setIsGeneratingCode(false);
			}
		},
		[appendToConsole],
	);

	const handleStatusUpdate = useCallback((newStatus: string) => {
		setStatus(newStatus);
	}, []);

	const handleTranscriptReceived = useCallback(
		(transcript: string, isFinal: boolean) => {
			if (isFinal && transcript) {
				setCurrentAppDescription((prev) => `${prev}${transcript} `.trim());
			} else if (transcript) {
			}
		},
		[],
	);

	const handleFunctionCallArguments = useCallback(
		(name: string, args: unknown) => {
			if (name === "create_app") {
				let description: string | undefined;
				if (
					typeof args === "object" &&
					args !== null &&
					"description" in args &&
					typeof (args as { description: unknown }).description === "string"
				) {
					description = (args as { description: string }).description;
				}
				if (description) {
					setCurrentAppDescription(description);
					setStatus("Received app description. Generating your app...");
					triggerAppGeneration(description);
				}
			} else {
				// Unhandled function call from AI
			}
		},
		[triggerAppGeneration],
	);

	const handleVoiceConnectionStateChange = useCallback(
		(state: RTCPeerConnectionState) => {
			setStatus(
				(prevStatus) =>
					`Voice connection: ${state}. ${prevStatus.replace(/^Voice connection: [^.]+\. /, "")}`,
			);
		},
		[],
	);

	const handleVoiceError = useCallback(
		(e: unknown) => {
			const msg = e instanceof Error ? e.message : "Unknown voice error";
			setStatus(
				(prevStatus) =>
					`Voice Error: ${msg}. ${prevStatus.replace(/^Voice Error: [^.]+\. /, "")}`,
			);
			appendToConsole("error", `Voice Error: ${msg}`, "failed");
		},
		[appendToConsole],
	);

	const {
		isListening: voiceSessionIsListening,
		isMuted: voiceSessionIsMuted,
		startListening,
		stopListening,
		toggleMute,
		audioRef: voiceSessionAudioRef,
	} = useVoiceSession({
		openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
		sessionParams: vibeCoderSessionParams,
		onStatusUpdate: handleStatusUpdate,
		onTranscriptReceived: handleTranscriptReceived,
		onFunctionCallArguments: handleFunctionCallArguments,
		onConnectionStateChange: handleVoiceConnectionStateChange,
		onError: handleVoiceError,
	});

	const handleFollowUpSubmit = async (message: string) => {
		if (!generatedAppCode) {
			setStatus("Please generate an app first before refining.");
			appendToConsole(
				"error",
				"Cannot refine: No app generated yet.",
				"failed",
			);
			return;
		}
		if (!message.trim()) {
			setStatus("Follow-up instruction cannot be empty.");
			appendToConsole(
				"error",
				"Follow-up instruction cannot be empty.",
				"failed",
			);
			return;
		}

		setStatus("Refining your app based on instructions...");
		setIsGeneratingCode(true);
		setError(null);
		appendToConsole("info", "Refinement process started.");

		const refinementDescription = appRefinemenPrompt(generatedAppCode, message);

		try {
			const filesObject = await generateAppOnServer({
				data: refinementDescription,
			});
			setStatus("Launching preview environment...");
			appendToConsole("info", "App refined successfully. Updating sandbox...");

			// Helper to detect preferred port from package.json content
			const detectPortFromFiles = (
				files: Array<{ path: string; content: string }>,
			): number => {
				const pkg = files.find((f) => /(^|\/)package\.json$/i.test(f.path));
				if (pkg) {
					try {
						const pkgJson = JSON.parse(pkg.content as string) as {
							dependencies?: Record<string, string>;
							devDependencies?: Record<string, string>;
						};
						const depsBlob = JSON.stringify({
							...pkgJson.dependencies,
							...pkgJson.devDependencies,
						});
						if (/vite/i.test(depsBlob)) return 5173;
						if (/next/i.test(depsBlob)) return 3000;
					} catch {}
				}
				return 3000;
			};

			let url: string;
			if (sandboxId) {
				// Reuse existing sandbox: write files and resolve URL
				await updateSandboxFilesOnServer({
					data: {
						sandboxId,
						files: filesObject.files as Array<{
							path: string;
							content: string;
						}>,
					},
				});
				const port = detectPortFromFiles(
					filesObject.files as Array<{ path: string; content: string }>,
				);
				const r = await getSandboxUrlOnServer({ data: { sandboxId, port } });
				url = r.url;
			} else {
				const r = await initSandboxWithFilesOnServer({ data: filesObject });
				url = r.url;
				setSandboxId(r.sandboxId);
			}
			setGeneratedFiles(
				filesObject.files as Array<{ path: string; content: string }>,
			);
			const indexHtml = filesObject.files.find((f: { path: string }) =>
				/(^|\/)index\.html$/i.test(f.path),
			);
			if (indexHtml && typeof indexHtml.content === "string") {
				setGeneratedAppCode(indexHtml.content);
				setSelectedFilePath(indexHtml.path);
			} else {
				setGeneratedAppCode(JSON.stringify(filesObject, null, 2));
				setSelectedFilePath(filesObject.files?.[0]?.path ?? null);
			}
			setPreviewUrl(url);
			setStatus("App refined successfully! Previewing updates.");
			appendToConsole("info", `Sandbox updated at ${url}`);
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : "Unknown error during refinement";
			setStatus(`Error refining app: ${msg}`);
			setError(msg);
			appendToConsole("error", `Error refining app: ${msg}`, "failed");
		} finally {
			setIsGeneratingCode(false);
		}
	};

	// No iframe data URL handling; sandbox preview URL is used instead

	return (
		<div className="flex flex-col h-screen">
			<Header
				onOpenMobileCodeDrawer={handleOpenMobileCodeDrawer}
				hasGeneratedCode={!!generatedAppCode}
			/>

			<div className="p-2 flex-grow flex flex-col">
				<div
					className={`flex flex-1 overflow-hidden ${
						isGeneratingCode || generatedAppCode ? "gap-2" : "justify-center"
					}`}
				>
					<CodeInstruct
						currentAppDescription={currentAppDescription}
						followUpText={followUpText}
						setFollowUpText={setFollowUpText}
						isListening={voiceSessionIsListening}
						status={status}
						startVoiceSession={startListening}
						stopVoiceSession={stopListening}
						isGeneratingCode={isGeneratingCode}
						generatedAppCode={generatedAppCode}
						isMuted={voiceSessionIsMuted}
						onToggleMute={toggleMute}
						onSendMessage={handleFollowUpSubmit}
					/>
					{(isGeneratingCode || generatedAppCode) && (
						<CodePreview
							displayMode={displayMode}
							setDisplayMode={setDisplayMode}
							generatedAppCode={generatedAppCode}
							isGeneratingCode={isGeneratingCode}
							previewUrl={previewUrl}
							files={generatedFiles}
							selectedFilePath={selectedFilePath}
							onSelectFile={setSelectedFilePath}
							consoleOutputs={consoleOutputs}
							setConsoleOutputs={setConsoleOutputs}
							onClearConsole={handleClearConsole}
						/>
					)}
				</div>
			</div>

			{/* Mobile Code Drawer */}
			<MobileCodeDrawer
				isOpen={isMobileCodeDrawerOpen}
				onClose={handleCloseMobileCodeDrawer}
				generatedAppCode={generatedAppCode}
				previewUrl={previewUrl}
			/>

			<audio
				ref={voiceSessionAudioRef}
				style={{ display: "none" }}
				aria-hidden="true"
				tabIndex={-1}
			>
				<track kind="captions" />
			</audio>
		</div>
	);
}
