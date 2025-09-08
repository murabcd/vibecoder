import { cn } from "@/lib/utils";

import MessageInput from "@/components/message-input";
import Greeting from "@/components/greeting";
import { useMemo, useRef, useState, useEffect, type ChangeEvent } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface CodeInstructProps {
	currentAppDescription: string;
	followUpText: string;
	setFollowUpText: (text: string) => void;
	isListening: boolean;
	status: string;
	startVoiceSession: () => Promise<void>;
	stopVoiceSession: () => void;
	isGeneratingCode: boolean;
	generatedAppCode: string | null;
	isMuted: boolean;
	onToggleMute: () => void;
	onSendMessage: (message: string) => void;
	selectedModel: string;
	onModelChange: (model: string) => void;

	// Versioning support
	projectId?: Id<"projects"> | null;
	onSelectVersion?: (
		data: null | {
			version: number;
			code: string;
			files: Array<{ path: string; content: string }>;
			previewUrl?: string;
		},
	) => void;
	defaultVersion?: number;
}

export default function CodeInstruct({
	currentAppDescription,
	followUpText,
	setFollowUpText,
	isListening,
	status,
	startVoiceSession,
	stopVoiceSession,
	isGeneratingCode,
	generatedAppCode,
	isMuted,
	onToggleMute,
	onSendMessage,
	selectedModel,
	onModelChange,
	projectId,
	onSelectVersion,
	defaultVersion,
}: CodeInstructProps) {
	const [selectedVersion, setSelectedVersion] = useState<string>("");
	const createProject = useMutation(api.projects.create);
	const router = useRouter();
	const creatingDraftRef = useRef(false);

	// Load versions for the current project (latest first)
	const versions = useQuery(api.projects.listVersions, {
		projectId: projectId || undefined,
	});
	const hasVersions = !!(versions && versions.length > 0);
	const hasDescriptionOrActive =
		(currentAppDescription && currentAppDescription.trim().length > 0) ||
		isGeneratingCode ||
		!!generatedAppCode;
	const showVersionSelector = !!(
		projectId &&
		hasVersions &&
		hasDescriptionOrActive
	);

	const versionOptions = useMemo(() => {
		if (!versions || versions.length === 0)
			return [] as Array<{
				value: string;
				label: string;
			}>;
		return versions.map((v) => {
			const date = new Date(v.createdAt as number);
			const label = `v${v.version} — ${date.toLocaleString()}`;
			return { value: String(v.version), label };
		});
	}, [versions]);

    // Initialize or update selection from defaultVersion (e.g., URL param)
    // Only react to changes in defaultVersion/versions, not local selection changes.
    useEffect(() => {
        if (!versions || versions.length === 0) return;
        if (defaultVersion) {
            setSelectedVersion(String(defaultVersion));
            if (onSelectVersion) {
                const v = versions.find((x) => x.version === defaultVersion);
                if (v) {
                    onSelectVersion({
                        version: v.version as number,
                        code: v.code as string,
                        files: v.files as Array<{ path: string; content: string }>,
                        previewUrl: (v.previewUrl as string | undefined) ?? undefined,
                    });
                }
            }
        } else {
            // No version specified in URL — show latest
            setSelectedVersion("");
            onSelectVersion?.(null);
        }
    }, [defaultVersion, versions, onSelectVersion]);

	const handleVersionChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setSelectedVersion(value);
		if (!onSelectVersion) return;
		if (!value) {
			onSelectVersion(null);
			return;
		}
		const v = versions?.find((x) => String(x.version) === value);
		if (v) {
			onSelectVersion({
				version: v.version as number,
				code: v.code as string,
				files: v.files as Array<{ path: string; content: string }>,
				previewUrl: (v.previewUrl as string | undefined) ?? undefined,
			});
		}
	};
	const handleToggleListening = async () => {
		if (isListening) {
			stopVoiceSession();
			return;
		}

		if (projectId) {
			await startVoiceSession();
			return;
		}

		if (creatingDraftRef.current) return;
		creatingDraftRef.current = true;
		try {
			const newId = await createProject({
				title: "Untitled",
				description: "",
				code: "",
				files: [],
			});
			await router.navigate({
				to: `/projects/${newId}`,
				search: { from: "all", autostart: true },
			});
		} catch (e) {
			console.error("Failed to create and navigate to project:", e);
			creatingDraftRef.current = false;
		}
	};

    const isActive = isGeneratingCode || generatedAppCode;
    const inputPlaceholder = generatedAppCode
        ? "Ask a follow up..."
        : "Describe the app you want to build...";

    // Intercept text send: if we don't have a project yet, create one and navigate
    // with the message so the project page can trigger generation.
    const handleTextSend = async (message: string) => {
        const trimmed = message.trim();
        if (!trimmed) return;
        if (projectId) {
            onSendMessage(trimmed);
            return;
        }
        if (creatingDraftRef.current) return;
        creatingDraftRef.current = true;
        try {
            const newId = await createProject({
                title: "Untitled",
                description: "",
                code: "",
                files: [],
            });
            try {
                sessionStorage.setItem("vc:initialDescription", trimmed);
            } catch {}
            // clear local input since we captured it
            setFollowUpText("");
            await router.navigate({
                to: `/projects/${newId}`,
                search: { from: "all" },
            });
        } catch (e) {
            console.error("Failed to create and navigate to project:", e);
        } finally {
            creatingDraftRef.current = false;
        }
    };

	return (
		<div
			className={cn(
				"flex flex-col h-full",
				isActive ? "w-full md:w-[400px] px-2" : "w-full md:max-w-3xl px-4",
			)}
		>
			<div
				className={cn(!isActive && "pt-48", "flex-1")}
				style={{ display: "flex", flexDirection: "column" }}
			>
				{/* Versions selector: show only when there are versions AND we have started/loaded an app */}
				{showVersionSelector ? (
					<div className="mb-2">
						<label
							htmlFor="version-select"
							className="text-xs text-muted-foreground block mb-1"
						>
							Version
						</label>
						<select
							id="version-select"
							className="w-full border rounded px-2 py-1 text-sm bg-background"
							value={selectedVersion}
							onChange={handleVersionChange}
							disabled={!hasVersions}
						>
							<option value="">Latest</option>
							{versionOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				) : null}
				{currentAppDescription ? (
					<div className="p-3 min-h-[100px] text-sm overflow-auto">
						{currentAppDescription}
					</div>
				) : (
					<div className="min-h-[100px] flex items-center justify-center text-sm">
						<Greeting />
					</div>
				)}
			</div>
			<div className="mt-auto">
            <MessageInput
                inputText={followUpText}
                setInputText={setFollowUpText}
                isListening={isListening}
                onToggleListening={handleToggleListening}
                status={status}
                isMuted={isMuted}
                onToggleMute={onToggleMute}
                onSendMessage={handleTextSend}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                placeholder={inputPlaceholder}
            />
			</div>
		</div>
	);
}
