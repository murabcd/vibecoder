import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { useVoiceSession } from "@/hooks/use-voice-session";
import { useSandboxStream } from "@/hooks/use-sandbox-stream";

import { appRefinemenPrompt } from "@/lib/ai/prompts";
import {
	vibeCoderSessionParams,
	generateAppOnServer,
	generateAppNameOnServer,
} from "@/lib/ai/ai";
import { modelRealtimeMini, getModelId } from "@/lib/ai/models";

import CodePreview from "@/components/code-preview";
import CodeInstruct from "@/components/code-instruct";
import MobileCodeDrawer from "@/components/mobile-code-drawer";
import type { ConsoleOutput } from "@/components/console";
import {
	getSandboxUrlOnServer,
	updateSandboxFilesOnServer,
} from "@/lib/sandbox";

interface AppHistoryItem {
	_id: string;
	title: string;
	description: string;
	code: string;
	files: Array<{ path: string; content: string }>;
	previewUrl?: string;
	sandboxId?: string;
	createdAt: number;
	starred?: boolean;
}

interface VibeCoderProps {
	project?: AppHistoryItem;
}

export default function VibeCoder({ project }: VibeCoderProps) {
	// Essential UI state only
	const [status, setStatus] = useState(
		"Click the voice button to start coding.",
	);
	const [followUpText, setFollowUpText] = useState("");
	const [isGeneratingCode, setIsGeneratingCode] = useState(false);
	const [displayMode, setDisplayMode] = useState<"preview" | "code">("preview");
	const [isMobileCodeDrawerOpen, setIsMobileCodeDrawerOpen] = useState(false);
	const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
	const [isRefinement, setIsRefinement] = useState(false);
	const [selectedModel, setSelectedModel] = useState(modelRealtimeMini);
	const [generationDescription, setGenerationDescription] =
		useState<string>("");
	const [generatedContent, setGeneratedContent] = useState<{
		code: string;
		files: Array<{ path: string; content: string }>;
		previewUrl?: string;
		sandboxId?: string;
	} | null>(null);

	// Derive app data from project prop or generation state
	const currentAppDescription = project?.description || generationDescription;
	const generatedAppCode = project?.code || generatedContent?.code || null;
	const generatedFiles = project?.files || generatedContent?.files || [];
	const previewUrl =
		project?.previewUrl || generatedContent?.previewUrl || null;
	const sandboxId = project?.sandboxId || generatedContent?.sandboxId || null;
	const currentAppHistoryId = project?._id as Id<"projects"> | null;

	// Track processed sandbox results to prevent duplicates
	const processedSandboxRef = useRef<Set<string>>(new Set());
	// Track last processed status message to prevent duplicate console logs
	const lastStatusMessageRef = useRef<string>("");

	// Convex mutations
	const createAppHistory = useMutation(api.projects.create);
	const updateAppHistory = useMutation(api.projects.update);

	// Streaming sandbox creation
	const { state: sandboxState, startSandbox } = useSandboxStream();

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

	const _handleOpenMobileCodeDrawer = useCallback(() => {
		setIsMobileCodeDrawerOpen(true);
	}, []);

	const handleCloseMobileCodeDrawer = useCallback(() => {
		setIsMobileCodeDrawerOpen(false);
	}, []);

	// Set initial selected file when project loads
	useEffect(() => {
		if (project?.files && project.files.length > 0) {
			const indexHtml = project.files.find((f: { path: string }) =>
				/(^|\/)index\.html$/i.test(f.path),
			);
			if (indexHtml) {
				setSelectedFilePath(indexHtml.path);
			} else {
				setSelectedFilePath(project.files[0].path);
			}
			setStatus(`Loaded "${project.title}" from history.`);
			appendToConsole("info", `Loaded "${project.title}" from history.`);
		}
	}, [project, appendToConsole]);

	const saveAppToHistory = useCallback(
		async (
			description: string,
			code: string,
			files: Array<{ path: string; content: string }>,
			previewUrl?: string,
			sandboxId?: string,
		) => {
			try {
				// Generate app name using OpenAI
				const appName = await generateAppNameOnServer({ data: description });

				// Save to history
				await createAppHistory({
					title: appName,
					description,
					code,
					files,
					previewUrl,
					sandboxId,
				});

				// App is now saved to Convex, no local state needed
				appendToConsole("info", `Saved "${appName}" to history.`);
			} catch (error) {
				console.error("Failed to save app to history:", error);
				appendToConsole("error", "Failed to save app to history.", "failed");
			}
		},
		[createAppHistory, appendToConsole],
	);

	const triggerAppGeneration = useCallback(
		async (description: string) => {
			if (!description.trim()) {
				setStatus("App description cannot be empty.");
				appendToConsole("error", "App description cannot be empty.", "failed");
				return;
			}
			setStatus("Generating your app...");
			setIsGeneratingCode(true);
			setFollowUpText("");
			setGenerationDescription(description); // Store the description for later use
			// Clear processed sandbox results for new generation
			processedSandboxRef.current.clear();
			lastStatusMessageRef.current = "";
			appendToConsole("info", "App generation initiated.");

			try {
				const filesObject = await generateAppOnServer({ data: description });

				// Store generated content for immediate preview
				const indexHtml = filesObject.files.find((f: { path: string }) =>
					/(^|\/)index\.html$/i.test(f.path),
				);
				setGeneratedContent({
					code: indexHtml?.content || JSON.stringify(filesObject, null, 2),
					files: filesObject.files as Array<{ path: string; content: string }>,
				});

				// Start sandbox creation
				appendToConsole(
					"info",
					"App generated successfully. Launching sandbox...",
				);

				// Start streaming sandbox creation
				await startSandbox({
					files: filesObject.files as Array<{ path: string; content: string }>,
					timeout: 300000, // 5 minutes
					ports: [3000, 5173], // Common dev server ports
				});

				// Set selected file for code view
				if (indexHtml) {
					setSelectedFilePath(indexHtml.path);
				} else if (filesObject.files.length > 0) {
					setSelectedFilePath(filesObject.files[0]?.path ?? null);
				}

				// The rest (URL, sandboxId, save to history) will be handled by useEffect
				// when sandboxState.result becomes available
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Unknown error";
				setStatus(`Error generating app: ${msg}`);
				appendToConsole("error", `Error generating app: ${msg}`, "failed");
				setIsGeneratingCode(false);
			}
		},
		[appendToConsole, startSandbox],
	);

	// Handle streaming sandbox state changes
	useEffect(() => {
		if (sandboxState.isLoading) {
			// Real-time progress updates
			const message = isRefinement
				? `Refining app: ${sandboxState.message} (${sandboxState.progress}%)`
				: `${sandboxState.message} (${sandboxState.progress}%)`;
			setStatus(message);

			// Prevent duplicate console messages
			if (
				sandboxState.message &&
				sandboxState.message !== lastStatusMessageRef.current
			) {
				lastStatusMessageRef.current = sandboxState.message;
				appendToConsole("info", sandboxState.message);
			}
		}

		if (sandboxState.result) {
			// Sandbox is ready!
			const { url, sandboxId } = sandboxState.result;

			// Prevent duplicate processing of the same sandbox result
			const resultKey = `${sandboxId}-${url}`;
			if (processedSandboxRef.current.has(resultKey)) {
				return; // Already processed this result
			}
			processedSandboxRef.current.add(resultKey);

			// Update generated content with preview URL and sandbox ID
			setGeneratedContent((prev) =>
				prev
					? {
							...prev,
							previewUrl: url,
							sandboxId,
						}
					: null,
			);

			if (isRefinement) {
				setStatus("App refined successfully! Previewing updates.");
				appendToConsole("info", `Sandbox updated at ${url}`);

				// Update existing app in history if we have one
				if (currentAppHistoryId) {
					updateAppHistory({
						id: currentAppHistoryId,
						code: generatedAppCode || "",
						files: generatedFiles,
						previewUrl: url,
						sandboxId,
					}).catch((e) => {
						console.error("Failed to update history:", e);
					});
				}
				setIsRefinement(false); // Reset refinement mode
			} else {
				setStatus("App generated successfully! Previewing now.");
				appendToConsole("info", `Sandbox ready at ${url}`);

				// Save to history for new apps
				const indexHtml = generatedFiles.find((f) =>
					/(^|\/)index\.html$/i.test(f.path),
				);

				// Save to history using the actual generation description
				if (generationDescription.trim()) {
					saveAppToHistory(
						generationDescription,
						indexHtml?.content || generatedAppCode || "",
						generatedFiles,
						url,
						sandboxId,
					).catch((e) => {
						console.error("Failed to save to history:", e);
					});
				}
			}

			setIsGeneratingCode(false);
		}

		if (sandboxState.error) {
			const errorMessage = isRefinement
				? `Refinement Error: ${sandboxState.error}`
				: `Sandbox Error: ${sandboxState.error}`;
			setStatus(errorMessage);
			appendToConsole("error", sandboxState.error, "failed");
			setIsGeneratingCode(false);
			setIsRefinement(false); // Reset refinement mode on error
		}
	}, [
		sandboxState,
		appendToConsole,
		saveAppToHistory,
		updateAppHistory,
		generationDescription,
		generatedAppCode,
		generatedFiles,
		currentAppHistoryId,
		isRefinement,
	]);

	const handleStatusUpdate = useCallback((newStatus: string) => {
		setStatus(newStatus);
	}, []);

	const handleTranscriptReceived = useCallback(
		(transcript: string, isFinal: boolean) => {
			if (isFinal && transcript) {
				// Transcript handling - could store in temporary state if needed
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
		sessionParams: {
			...vibeCoderSessionParams,
			model: getModelId(selectedModel),
		},
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
		appendToConsole("info", "Refinement process started.");

		const refinementDescription = appRefinemenPrompt(generatedAppCode, message);

		try {
			const filesObject = await generateAppOnServer({
				data: refinementDescription,
			});
			appendToConsole("info", "App refined successfully. Updating sandbox...");

			// Update selected file for the refined app
			const indexHtml = filesObject.files.find((f: { path: string }) =>
				/(^|\/)index\.html$/i.test(f.path),
			);
			if (indexHtml) {
				setSelectedFilePath(indexHtml.path);
			} else if (filesObject.files.length > 0) {
				setSelectedFilePath(filesObject.files[0]?.path ?? null);
			}

			if (sandboxId) {
				// Reuse existing sandbox: write files and resolve URL (non-streaming)
				await updateSandboxFilesOnServer({
					data: {
						sandboxId,
						files: filesObject.files as Array<{
							path: string;
							content: string;
						}>,
					},
				});

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

				const port = detectPortFromFiles(
					filesObject.files as Array<{ path: string; content: string }>,
				);
				const r = await getSandboxUrlOnServer({ data: { sandboxId, port } });

				setStatus("App refined successfully! Previewing updates.");
				appendToConsole("info", `Sandbox updated at ${r.url}`);
				setIsGeneratingCode(false);

				// Update existing app in history if we have one
				if (currentAppHistoryId) {
					try {
						await updateAppHistory({
							id: currentAppHistoryId,
							code: indexHtml?.content || JSON.stringify(filesObject, null, 2),
							files: filesObject.files as Array<{
								path: string;
								content: string;
							}>,
							previewUrl: r.url,
							sandboxId: sandboxId || undefined,
						});
						appendToConsole("info", "Updated app in history.");
					} catch (error) {
						console.error("Failed to update app in history:", error);
						appendToConsole(
							"error",
							"Failed to update app in history.",
							"failed",
						);
					}
				}
			} else {
				// Create new sandbox with streaming
				setIsRefinement(true);
				await startSandbox({
					files: filesObject.files as Array<{ path: string; content: string }>,
					timeout: 300000,
				});
				return; // Let the useEffect handle the rest when streaming completes
			}
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : "Unknown error during refinement";
			setStatus(`Error refining app: ${msg}`);
			appendToConsole("error", `Error refining app: ${msg}`, "failed");
			setIsGeneratingCode(false);
			setIsRefinement(false);
		}
	};

	// No iframe data URL handling; sandbox preview URL is used instead

	return (
		<div className="flex flex-col h-[calc(100vh-4rem)]">
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
						selectedModel={selectedModel}
						onModelChange={setSelectedModel}
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
