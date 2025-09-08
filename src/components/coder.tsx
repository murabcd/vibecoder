import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { useRealtimeSession } from "@/lib/use-realtime-session";
import { useSandboxStream } from "@/hooks/use-sandbox-stream";

import {
	generateAppOnServer,
	generateAppNameOnServer,
	generateAppRefinementOnServer,
} from "@/lib/ai/session";
import { modelRealtimeMini } from "@/lib/ai/models";
import { vibeCoderScenario } from "@/agents";

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
	projectId?: string; // present on project route; undefined on root
	autostart?: boolean;
	defaultVersion?: number | null;
	initialDescription?: string;
}

export default function VibeCoder({
	project,
	projectId,
	autostart,
	defaultVersion,
	initialDescription,
}: VibeCoderProps) {
	const [status, setStatus] = useState(
		"Click the voice button to start coding or write a description.",
	);
	const [followUpText, setFollowUpText] = useState("");
	const [isGeneratingCode, setIsGeneratingCode] = useState(false);
	const [displayMode, setDisplayMode] = useState<"preview" | "code">("preview");
	const [isMobileCodeDrawerOpen, setIsMobileCodeDrawerOpen] = useState(false);
	const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
	const [isRefinement, setIsRefinement] = useState(false);
	const [isPreviewSwitch, setIsPreviewSwitch] = useState(false);
	const [isSwitchingVersion, setIsSwitchingVersion] = useState(false);
	const [selectedModel, setSelectedModel] = useState(modelRealtimeMini);
	const [generationDescription, setGenerationDescription] =
		useState<string>("");
	const [generatedContent, setGeneratedContent] = useState<{
		code: string;
		files: Array<{ path: string; content: string }>;
		previewUrl?: string;
		sandboxId?: string;
	} | null>(null);

	// Selected version override
	const [selectedVersionData, setSelectedVersionData] = useState<null | {
		version: number;
		code: string;
		files: Array<{ path: string; content: string }>;
		previewUrl?: string;
	}>(null);

	const currentAppDescription = project?.description || generationDescription;
	const generatedAppCode =
		selectedVersionData?.code ??
		generatedContent?.code ??
		project?.code ??
		null;
	const generatedFiles =
		selectedVersionData?.files ??
		generatedContent?.files ??
		project?.files ??
		[];
	// If a version is explicitly selected, do not fall back to newer preview URLs,
	// otherwise the iframe may show a different version than the selected code/files.
	const previewUrl = selectedVersionData
		? (selectedVersionData.previewUrl ?? null)
		: (generatedContent?.previewUrl ?? project?.previewUrl ?? null);
	const sandboxId = project?.sandboxId || generatedContent?.sandboxId || null;
	const currentSandboxId = sandboxId;
	const currentAppHistoryId = project?._id as Id<"projects"> | null;

	// Track processed sandbox results to prevent duplicates
	const processedSandboxRef = useRef<Set<string>>(new Set());
	// Track last processed status message to prevent duplicate console logs
	const lastStatusMessageRef = useRef<string>("");

	// Track last applied latest files snapshot (for auto-sync in Latest view)
	const latestFilesHashRef = useRef<string | null>(null);
	// Track if we've completed initial project load to prevent unnecessary sync
	const initialProjectLoadRef = useRef<boolean>(false);

	// Utility function to add cache-busting parameter to URL
	const addCacheBusting = useCallback((url: string): string => {
		try {
			const u = new URL(url);
			u.searchParams.set("t", Date.now().toString());
			return u.toString();
		} catch {
			return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
		}
	}, []);

	// Utility function to detect preferred port from package.json
	const detectPortFromFiles = useCallback(
		(files: Array<{ path: string; content: string }>): number => {
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
		},
		[],
	);

	// Convex mutations
	const createAppHistory = useMutation(api.projects.create);
	const updateAppHistory = useMutation(api.projects.update);

	// Router for URL search updates (version persistence)
	const router = useRouter();

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
					id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
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

			// Reset initial load flag when project changes
			initialProjectLoadRef.current = false;
		}
	}, [project, appendToConsole]);

	// Handle selected version files

	useEffect(() => {
		if (selectedVersionData?.files && selectedVersionData.files.length > 0) {
			const indexHtml = selectedVersionData.files.find((f) =>
				/(^|\/)index\.html$/i.test(f.path),
			);
			if (indexHtml) {
				setSelectedFilePath(indexHtml.path);
			} else {
				setSelectedFilePath(selectedVersionData.files[0].path);
			}
		}
	}, [selectedVersionData]);

	// Expose triggerAppGeneration to window for agent tools to use
	const triggerAppGeneration = useCallback(
		async (description: string) => {
			if (isGeneratingCode) {
				appendToConsole(
					"info",
					"Already generating. Please wait for it to finish.",
				);
				return;
			}
			if (!description.trim()) {
				setStatus("App description cannot be empty.");
				appendToConsole("error", "App description cannot be empty.", "failed");
				return;
			}
			setStatus("Generating your app...");
			setIsGeneratingCode(true);
			setFollowUpText("");
			setGenerationDescription(description); // Store the description for later use
			setSelectedVersionData(null); // Reset version selection for new generation
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
		[appendToConsole, startSandbox, isGeneratingCode],
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
			// Add a cache-busting param so if the underlying domain stays the same,
			// the iframe still refreshes to pick up new files.
			const bustedUrl = addCacheBusting(url);

			// Preview switch: only update preview target without persisting history
			if (isPreviewSwitch) {
				// If a specific version was selected, update its preview URL
				setSelectedVersionData((prev) =>
					prev ? { ...prev, previewUrl: bustedUrl } : prev,
				);
				// Also keep generatedContent.sandboxId fresh so we can reuse
				setGeneratedContent((prev) =>
					prev ? { ...prev, previewUrl: bustedUrl, sandboxId } : prev,
				);
				setStatus("Preview ready.");
				appendToConsole("info", `Preview ready at ${url}`);
				setIsPreviewSwitch(false);
				return;
			}

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

				// On refinement completion, show latest content
				setSelectedVersionData(null);
				setIsRefinement(false); // Reset refinement mode
			} else {
				setStatus("App generated successfully! Previewing now.");
				appendToConsole("info", `Sandbox ready at ${url}`);

				// Save to history for new apps or update current project
				const indexHtml = generatedFiles.find((f) =>
					/(^|\/)index\.html$/i.test(f.path),
				);

				// Use the actual generation description
				const finalDescription = generationDescription.trim();

				(async () => {
					try {
						// Always generate a friendly name from description
						const appName = finalDescription
							? await generateAppNameOnServer({ data: finalDescription })
							: project?.title || "Untitled";

						if (currentAppHistoryId) {
							await updateAppHistory({
								id: currentAppHistoryId,
								title: appName,
								description: finalDescription || project?.description || "",
								code: indexHtml?.content || generatedAppCode || "",
								files: generatedFiles,
								previewUrl: url,
								sandboxId,
							});
							appendToConsole("info", `Updated "${appName}" (new version).`);
						} else {
							await createAppHistory({
								title: appName,
								description: finalDescription,
								code: indexHtml?.content || generatedAppCode || "",
								files: generatedFiles,
								previewUrl: url,
								sandboxId,
							});
							appendToConsole("info", `Saved "${appName}" to history.`);
						}
					} catch (e) {
						console.error("Failed to persist app:", e);
						appendToConsole(
							"error",
							"Failed to save app to history.",
							"failed",
						);
					}
				})();
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
		updateAppHistory,
		generationDescription,
		generatedAppCode,
		generatedFiles,
		currentAppHistoryId,
		isRefinement,
		isPreviewSwitch,
		createAppHistory,
		project?.description,
		project?.title,
		addCacheBusting,
	]);

	const handleFollowUpSubmit = useCallback(
		async (message: string) => {
			if (isGeneratingCode) {
				appendToConsole(
					"info",
					"Already processing. Please wait for it to finish.",
				);
				return;
			}
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

			try {
				const filesObject = await generateAppRefinementOnServer({
					data: {
						currentCode: generatedAppCode,
						refinementMessage: message,
					},
				});
				appendToConsole(
					"info",
					"App refined successfully. Updating sandbox...",
				);

				// Update generated content with refined files
				const indexHtml = filesObject.files.find((f: { path: string }) =>
					/(^|\/)index\.html$/i.test(f.path),
				);
				setGeneratedContent({
					code: indexHtml?.content || JSON.stringify(filesObject, null, 2),
					files: filesObject.files as Array<{ path: string; content: string }>,
					previewUrl: previewUrl || undefined,
					sandboxId: sandboxId || undefined,
				});

				// Update the description to show the refinement instruction
				setGenerationDescription((prev) => `${prev}\n\nRefinement: ${message}`);

				// Update selected file for the refined app
				if (indexHtml) {
					setSelectedFilePath(indexHtml.path);
				} else if (filesObject.files.length > 0) {
					setSelectedFilePath(filesObject.files[0]?.path ?? null);
				}

				if (sandboxId) {
					// Reuse existing sandbox: write files and resolve URL (non-streaming)
					const updateResult = await updateSandboxFilesOnServer({
						data: {
							sandboxId,
							files: filesObject.files as Array<{
								path: string;
								content: string;
							}>,
							timeout: 300000,
							ports: [3000, 5173],
						},
					});

					// If sandbox was replaced, update the sandboxId and URL
					let currentUrl: string;
					let currentSandboxId = sandboxId;
					if (updateResult.sandboxReplaced && updateResult.url) {
						currentSandboxId = updateResult.sandboxId;
						currentUrl = updateResult.url;
						appendToConsole("info", "Sandbox was replaced due to inactivity.");
					} else {
						const port = detectPortFromFiles(
							filesObject.files as Array<{ path: string; content: string }>,
						);
						const r = await getSandboxUrlOnServer({
							data: { sandboxId: currentSandboxId, port },
						});
						currentUrl = r.url;
					}

					// Ensure preview updates even if the base URL hasn't changed
					const bustedUrl = addCacheBusting(currentUrl);
					setGeneratedContent((prev) =>
						prev
							? { ...prev, previewUrl: bustedUrl, sandboxId: currentSandboxId }
							: prev,
					);

					setStatus("App refined successfully! Previewing updates.");
					appendToConsole("info", `Sandbox updated at ${currentUrl}`);
					setIsGeneratingCode(false);

					// Update existing app in history if we have one
					if (currentAppHistoryId) {
						try {
							await updateAppHistory({
								id: currentAppHistoryId,
								code:
									indexHtml?.content || JSON.stringify(filesObject, null, 2),
								files: filesObject.files as Array<{
									path: string;
									content: string;
								}>,
								previewUrl: currentUrl,
								sandboxId: currentSandboxId,
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
					// Update generated content with refined files before creating new sandbox
					setGeneratedContent({
						code: indexHtml?.content || JSON.stringify(filesObject, null, 2),
						files: filesObject.files as Array<{
							path: string;
							content: string;
						}>,
					});

					// Update the description to show the refinement instruction
					setGenerationDescription(
						(prev) => `${prev}\n\nRefinement: ${message}`,
					);

					// Create new sandbox with streaming
					setIsRefinement(true);
					await startSandbox({
						files: filesObject.files as Array<{
							path: string;
							content: string;
						}>,
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
		},
		[
			generatedAppCode,
			appendToConsole,
			sandboxId,
			updateAppHistory,
			currentAppHistoryId,
			startSandbox,
			previewUrl,
			isGeneratingCode,
			addCacheBusting,
			detectPortFromFiles,
		],
	);

	// Unified text submit: generate when no app exists; otherwise refine
	const handleTextSubmit = useCallback(
		async (message: string) => {
			if (!message.trim()) return;
			if (!generatedAppCode) {
				// Treat as initial generation request
				await triggerAppGeneration(message.trim());
				return;
			}
			// Otherwise, refine existing app
			await handleFollowUpSubmit(message.trim());
		},
		[generatedAppCode, triggerAppGeneration, handleFollowUpSubmit],
	);

	// Make functions available to agent tools via window object
	useEffect(() => {
		window.triggerAppGeneration = triggerAppGeneration;
		window.handleFollowUpSubmit = handleFollowUpSubmit;

		return () => {
			delete window.triggerAppGeneration;
			delete window.handleFollowUpSubmit;
		};
	}, [triggerAppGeneration, handleFollowUpSubmit]);

	// If a route provided an initial description (from text submit before project existed),
	// trigger generation once after callbacks are ready AND project has loaded when on project route.
	const initialGenRef = useRef(false);
	useEffect(() => {
		if (!initialDescription || initialGenRef.current) return;
		// If we are on a project route, wait until the project is loaded so updates
		// attach to the correct record instead of creating a duplicate.
		if (projectId && !project?._id) return;
		initialGenRef.current = true;
		void triggerAppGeneration(initialDescription);
	}, [initialDescription, triggerAppGeneration, project?._id, projectId]);

	// Audio ref for the realtime session
	const audioRef = useRef<HTMLAudioElement>(null);

	// Realtime session with agents
	const { connect, disconnect, mute } = useRealtimeSession({
		onConnectionChange: (status) => {
			setStatus(`Session: ${status}`);
		},
		onAgentHandoff: (agentName) => {
			setStatus(`Handed off to ${agentName} agent`);
			appendToConsole("info", `Agent handoff: ${agentName}`);
		},
	});

	// Session connection state
	const [isConnected, setIsConnected] = useState(false);
	const [isMuted, setIsMuted] = useState(false);

	// Get ephemeral key function
	const getEphemeralKey = useCallback(async () => {
		const response = await fetch("/api/session");
		const data = await response.json();
		return data.client_secret.value;
	}, []);

	// Connect/disconnect functions
	const startListening = useCallback(async () => {
		if (!isConnected) {
			try {
				await connect({
					getEphemeralKey,
					initialAgents: vibeCoderScenario,
					audioElement: audioRef.current || undefined,
					extraContext: {
						currentAppCode: generatedAppCode || undefined,
					},
				});
				setIsConnected(true);
				setStatus("Connected! Start speaking to create an app.");
			} catch (error) {
				console.error("Failed to connect:", error);
				setStatus("Failed to connect to voice session");
				appendToConsole(
					"error",
					"Failed to connect to voice session",
					"failed",
				);
			}
		}
	}, [
		isConnected,
		connect,
		getEphemeralKey,
		generatedAppCode,
		appendToConsole,
	]);

	const stopListening = useCallback(() => {
		if (isConnected) {
			disconnect();
			setIsConnected(false);
			setStatus("Disconnected from voice session.");
		}
	}, [isConnected, disconnect]);

	const toggleMute = useCallback(() => {
		mute(!isMuted);
		setIsMuted(!isMuted);
	}, [isMuted, mute]);

	// Auto-start voice session once when arriving with autostart flag
	const autostartRef = useRef(false);
	useEffect(() => {
		if (autostart && !autostartRef.current) {
			autostartRef.current = true;
			void startListening();
		}
	}, [autostart, startListening]);

	// Preview URL is cache-busted at creation/update time to avoid reload loops here

	// Handle version selection: set data and persist to URL
	const handleVersionSelect = useCallback(
		async (
			data: null | {
				version: number;
				code: string;
				files: Array<{ path: string; content: string }>;
				previewUrl?: string;
			},
		) => {
			// Set loading states immediately
			setIsSwitchingVersion(true);
			setStatus(
				data ? `Loading v${data.version}...` : "Loading latest version...",
			);

			const currentSearch = router.state.location.search as {
				from?: string;
				version?: number;
			};

			// Update URL first
			void router.navigate({
				to: `/projects/${currentAppHistoryId ?? project?._id}`,
				search: {
					from: currentSearch?.from ?? "all",
					...(data?.version ? { version: data.version } : {}),
				},
				replace: true,
			});

			try {
				let finalPreviewUrl: string | undefined;
				let finalSandboxId = currentSandboxId;

				if (data) {
					// Handle version selection
					if (sandboxId) {
						try {
							const updateResult = await updateSandboxFilesOnServer({
								data: {
									sandboxId,
									files: data.files,
									timeout: 300000,
									ports: [3000, 5173],
								},
							});

							if (updateResult.sandboxReplaced) {
								finalSandboxId = updateResult.sandboxId;
								appendToConsole(
									"info",
									"Sandbox was replaced due to inactivity.",
								);
							}

							// Get preview URL for the updated sandbox
							const port = detectPortFromFiles(data.files);
							const r = await getSandboxUrlOnServer({
								data: { sandboxId: finalSandboxId, port },
							});
							finalPreviewUrl = addCacheBusting(r.url);
						} catch (_e) {
							// Fallback to creating new sandbox
							setIsPreviewSwitch(true);
							await startSandbox({
								files: data.files,
								timeout: 300000,
								ports: [3000, 5173],
							});
							// For new sandbox, we'll get the URL from the sandbox creation process
							finalPreviewUrl = data.previewUrl;
						}
					} else {
						// No existing sandbox, create new one
						setIsPreviewSwitch(true);
						await startSandbox({
							files: data.files,
							timeout: 300000,
							ports: [3000, 5173],
						});
						finalPreviewUrl = data.previewUrl;
					}

					// Single state update with all data
					setSelectedVersionData({
						version: data.version,
						code: data.code,
						files: data.files,
						previewUrl: finalPreviewUrl,
					});

					setStatus(`Previewing v${data.version} in sandbox.`);
					appendToConsole("info", `Preview switched to v${data.version}`);
				} else {
					// Handle switching back to Latest
					const latestFiles = generatedContent?.files ?? project?.files ?? [];
					if (latestFiles.length > 0) {
						if (sandboxId) {
							try {
								const updateResult = await updateSandboxFilesOnServer({
									data: {
										sandboxId,
										files: latestFiles,
										timeout: 300000,
										ports: [3000, 5173],
									},
								});

								if (updateResult.sandboxReplaced) {
									finalSandboxId = updateResult.sandboxId;
									appendToConsole(
										"info",
										"Sandbox was replaced due to inactivity.",
									);
								}

								// Get preview URL for latest version
								const port = detectPortFromFiles(latestFiles);
								const r = await getSandboxUrlOnServer({
									data: { sandboxId: finalSandboxId, port },
								});
								finalPreviewUrl = addCacheBusting(r.url);
							} catch (_e) {
								// Fallback to creating new sandbox
								setIsPreviewSwitch(true);
								await startSandbox({
									files: latestFiles,
									timeout: 300000,
									ports: [3000, 5173],
								});
								return;
							}
						} else {
							// No existing sandbox, create new one
							setIsPreviewSwitch(true);
							await startSandbox({
								files: latestFiles,
								timeout: 300000,
								ports: [3000, 5173],
							});
							return;
						}

						// Single state update for latest version
						setGeneratedContent((prev) =>
							prev
								? {
										code: prev.code,
										files: prev.files,
										previewUrl: finalPreviewUrl,
										sandboxId: finalSandboxId || undefined,
									}
								: prev,
						);

						setStatus("Previewing latest version in sandbox.");
						appendToConsole("info", "Preview switched to Latest");
					}
				}
			} catch (e) {
				console.error("Failed to update sandbox for version preview:", e);
				// Reset to safe state
				setStatus("Failed to switch version");
				appendToConsole("error", "Failed to switch version", "failed");
			} finally {
				setIsSwitchingVersion(false);
			}
		},
		[
			router,
			currentAppHistoryId,
			project?._id,
			sandboxId,
			currentSandboxId,
			startSandbox,
			appendToConsole,
			generatedContent?.files,
			project?.files,
			addCacheBusting,
			detectPortFromFiles,
		],
	);

	// Keep "Latest" preview in sync when project files update (e.g., after reopening)
	useEffect(() => {
		// Only act when not viewing a specific version and not mid-generation/refinement
		if (selectedVersionData) return;
		if (isGeneratingCode || isRefinement || isPreviewSwitch) return;
		const latestFiles = project?.files ?? [];
		if (!latestFiles || latestFiles.length === 0) return;

		// Skip sync on initial project load to prevent flickering
		if (!initialProjectLoadRef.current && project?._id) {
			initialProjectLoadRef.current = true;
			return;
		}
		const hash = (() => {
			try {
				return JSON.stringify(latestFiles);
			} catch {
				return String(Date.now());
			}
		})();
		if (latestFilesHashRef.current === hash) return;
		latestFilesHashRef.current = hash;

		(async () => {
			try {
				if (sandboxId) {
					try {
						const updateResult = await updateSandboxFilesOnServer({
							data: {
								sandboxId,
								files: latestFiles,
								timeout: 300000,
								ports: [3000, 5173],
							},
						});

						// If sandbox was replaced, update sandboxId and URL immediately
						let currentUrl: string | undefined;
						let currentSandboxId = sandboxId;
						if (updateResult.sandboxReplaced && updateResult.url) {
							currentSandboxId = updateResult.sandboxId;
							currentUrl = updateResult.url;
							appendToConsole(
								"info",
								"Sandbox was replaced due to inactivity.",
							);
						} else {
							const port = detectPortFromFiles(latestFiles);
							const r = await getSandboxUrlOnServer({
								data: { sandboxId: currentSandboxId, port },
							});
							currentUrl = r.url;
						}

						const bustedUrl = addCacheBusting(currentUrl ?? "");
						setGeneratedContent((prev) =>
							prev
								? {
										...prev,
										previewUrl: bustedUrl,
										sandboxId: currentSandboxId,
									}
								: {
										code: project?.code || "",
										files: latestFiles,
										previewUrl: bustedUrl,
										sandboxId: currentSandboxId,
									},
						);
						setStatus("Previewing latest version in sandbox.");
						appendToConsole("info", "Preview synced to Latest");
						return;
					} catch (e) {
						console.error("Failed to update sandbox:", e);
					}
				}

				// No sandbox yet: create one for latest files
				setIsPreviewSwitch(true);
				await startSandbox({
					files: latestFiles,
					timeout: 300000,
					ports: [3000, 5173],
				});
			} catch (e) {
				console.error("Failed to sync latest preview:", e);
			}
		})();
	}, [
		project?.files,
		project?._id,
		sandboxId,
		selectedVersionData,
		isGeneratingCode,
		isRefinement,
		isPreviewSwitch,
		startSandbox,
		appendToConsole,
		addCacheBusting,
		detectPortFromFiles,
		project?.code,
	]);

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
						isListening={isConnected}
						status={status}
						startVoiceSession={startListening}
						stopVoiceSession={stopListening}
						isGeneratingCode={isGeneratingCode}
						generatedAppCode={generatedAppCode}
						isMuted={isMuted}
						onToggleMute={toggleMute}
						onSendMessage={handleTextSubmit}
						selectedModel={selectedModel}
						onModelChange={setSelectedModel}
						projectId={currentAppHistoryId}
						onSelectVersion={handleVersionSelect}
						defaultVersion={defaultVersion ?? undefined}
					/>
					{(isGeneratingCode || generatedAppCode) && (
						<CodePreview
							displayMode={displayMode}
							setDisplayMode={setDisplayMode}
							generatedAppCode={generatedAppCode}
							isGeneratingCode={isGeneratingCode}
							isSwitchingVersion={isSwitchingVersion}
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
				ref={audioRef}
				style={{ display: "none" }}
				aria-hidden="true"
				tabIndex={-1}
			>
				<track kind="captions" />
			</audio>
		</div>
	);
}
