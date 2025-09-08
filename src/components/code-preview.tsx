import {
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";

import {
	Eye,
	Code2,
	Loader,
	ChevronRight,
	File as FileIcon,
	Folder as FolderIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { json as jsonLang } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

import Console, { type ConsoleOutput } from "@/components/console";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";

function getLanguageExtension(filePath?: string) {
	const path = (filePath ?? "").toLowerCase();
	if (path.endsWith(".json")) return jsonLang();
	if (path.endsWith(".css")) return cssLang();
	if (path.endsWith(".ts") || path.endsWith(".tsx")) {
		return javascript({ typescript: true, jsx: path.endsWith(".tsx") });
	}
	if (path.endsWith(".js") || path.endsWith(".jsx")) {
		return javascript({ jsx: path.endsWith(".jsx") });
	}
	return html();
}

interface CodePreviewProps {
	displayMode: "preview" | "code";
	setDisplayMode: (mode: "preview" | "code") => void;
	generatedAppCode: string | null;
	isGeneratingCode: boolean;
	isSwitchingVersion?: boolean;
	previewUrl: string | null;
	files: Array<{ path: string; content: string }>;
	selectedFilePath: string | null;
	onSelectFile: (path: string) => void;
	consoleOutputs: Array<ConsoleOutput>;
	setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
	onClearConsole?: () => void;
}

const CONSOLE_HEADER_HEIGHT = "h-[2rem]";
const CONSOLE_EXPANDED_CONTENT_HEIGHT = "h-45";

export default function CodePreview({
	displayMode,
	setDisplayMode,
	generatedAppCode,
	isGeneratingCode,
	isSwitchingVersion = false,
	previewUrl,
	files,
	selectedFilePath,
	onSelectFile,
	consoleOutputs,
	setConsoleOutputs,
	onClearConsole,
}: CodePreviewProps) {
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorViewRef = useRef<EditorView | null>(null);
	const [isCodeReady, setIsCodeReady] = useState(false);
	const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	// Pick content based on selected file when available
	const selectedFileContent = (() => {
		const match = files?.find((f) => f.path === selectedFilePath);
		return match?.content ?? generatedAppCode ?? "";
	})();

	useEffect(() => {
		if (
			displayMode !== "code" ||
			!editorContainerRef.current ||
			!selectedFileContent
		) {
			return;
		}

		// Always recreate to ensure language extension matches selected file
		if (editorViewRef.current) {
			editorViewRef.current.destroy();
			editorViewRef.current = null;
			setIsCodeReady(false);
		}

		const startState = EditorState.create({
			doc: selectedFileContent,
			extensions: [
				basicSetup,
				getLanguageExtension(selectedFilePath ?? undefined),
				oneDark,
				EditorView.editable.of(false),
				EditorView.theme({
					"&": { height: "100%" },
					".cm-scroller": { overflow: "auto" },
					".cm-content": { whiteSpace: "pre" },
					".cm-gutters": { fontSize: "0.875rem" },
					".cm-line": { fontSize: "0.875rem" },
				}),
			],
		});

		const view = new EditorView({
			state: startState,
			parent: editorContainerRef.current,
		});
		editorViewRef.current = view;
		setIsCodeReady(true);

		return () => {
			view.destroy();
			editorViewRef.current = null;
			setIsCodeReady(false);
		};
	}, [displayMode, selectedFileContent, selectedFilePath]);

	useEffect(() => {
		if (
			displayMode === "code" &&
			editorViewRef.current &&
			selectedFileContent &&
			isCodeReady
		) {
			const currentDoc = editorViewRef.current.state.doc.toString();
			if (currentDoc !== selectedFileContent) {
				editorViewRef.current.dispatch({
					changes: {
						from: 0,
						to: currentDoc.length,
						insert: selectedFileContent,
					},
				});
			}
		}
	}, [selectedFileContent, displayMode, isCodeReady]);

	return (
		<div className="hidden md:flex flex-1 flex-col min-w-0 h-full border rounded-md bg-card overflow-hidden">
			<div className="flex flex-col h-full overflow-hidden">
				<div className="flex flex-1 overflow-hidden">
					{displayMode === "code" ? (
						<ResizablePanelGroup
							direction="horizontal"
							className="flex-1 overflow-hidden"
						>
							<ResizablePanel
								defaultSize={24}
								minSize={12}
								maxSize={40}
								className="min-w-[160px]"
							>
								<div className="h-full border-r bg-background overflow-auto p-2">
									<div className="text-xs font-medium mb-2">Files</div>
									<div className="space-y-1">
										{buildTree(files).map((node) => (
											<TreeNodeView
												key={node.key}
												node={node}
												depth={0}
												onSelectFile={onSelectFile}
												selectedFilePath={selectedFilePath ?? ""}
											/>
										))}
									</div>
								</div>
							</ResizablePanel>
							<ResizableHandle withHandle />
							<ResizablePanel defaultSize={76} minSize={40}>
								<div className="relative h-full overflow-auto">
									<div
										ref={editorContainerRef}
										className="h-full w-full text-sm"
									/>
									<div className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur-sm p-1 shadow-md rounded-md">
										<ToggleGroup
											type="single"
											value={displayMode}
											onValueChange={(value) => {
												if (value) setDisplayMode(value as "preview" | "code");
											}}
											aria-label="Display mode"
											size="sm"
										>
											<ToggleGroupItem value="preview" aria-label="Preview">
												<Eye className="h-4 w-4" />
											</ToggleGroupItem>
											<ToggleGroupItem value="code" aria-label="Code">
												<Code2 className="h-4 w-4" />
											</ToggleGroupItem>
										</ToggleGroup>
									</div>
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					) : (
						<div className="flex-1 relative overflow-auto">
							{(isGeneratingCode && !previewUrl) || isSwitchingVersion ? (
								<div className="h-full w-full flex flex-row items-center justify-center text-muted-foreground gap-2">
									<Loader size={24} className="animate-spin" />
									<p>
										{isSwitchingVersion ? "Previewing..." : "Generating..."}
									</p>
								</div>
							) : (
								<iframe
									key={previewUrl} // Force re-mount when URL changes
									className="h-full w-full bg-card"
									ref={iframeRef}
									sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
									title="Generated App"
									src={previewUrl ?? "about:blank"}
								/>
							)}

							<div className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur-sm p-1 shadow-md rounded-md">
								<ToggleGroup
									type="single"
									value={displayMode}
									onValueChange={(value) => {
										if (value) setDisplayMode(value as "preview" | "code");
									}}
									aria-label="Display mode"
									size="sm"
								>
									<ToggleGroupItem value="preview" aria-label="Preview">
										<Eye className="h-4 w-4" />
									</ToggleGroupItem>
									<ToggleGroupItem value="code" aria-label="Code">
										<Code2 className="h-4 w-4" />
									</ToggleGroupItem>
								</ToggleGroup>
							</div>
						</div>
					)}
				</div>

				<Console
					consoleOutputs={consoleOutputs}
					setConsoleOutputs={setConsoleOutputs}
					isVisible={true}
					isExpanded={isConsoleExpanded}
					onToggleExpand={() => setIsConsoleExpanded((prev) => !prev)}
					onClearConsole={onClearConsole}
					className={cn(
						"flex-shrink-0",
						isConsoleExpanded
							? CONSOLE_EXPANDED_CONTENT_HEIGHT
							: CONSOLE_HEADER_HEIGHT,
					)}
				/>
			</div>
		</div>
	);
}

// --- Tree Helpers ---
type TreeNode = {
	key: string;
	name: string;
	path?: string; // present for files
	children?: TreeNode[]; // present for directories
	isDir: boolean;
};

function buildTree(
	files: Array<{ path: string; content: string }>,
): TreeNode[] {
	const root: TreeNode = { key: "", name: "", isDir: true, children: [] };

	function ensureDir(
		parent: TreeNode,
		dirName: string,
		fullKey: string,
	): TreeNode {
		const children = parent.children as TreeNode[];
		let node = children.find((c) => c.isDir && c.name === dirName);
		if (!node) {
			node = { key: fullKey, name: dirName, isDir: true, children: [] };
			children.push(node);
		}
		return node;
	}

	for (const f of files) {
		const parts = f.path.split("/").filter(Boolean);
		let parent = root;
		let acc = "";
		for (let i = 0; i < parts.length; i += 1) {
			const part = parts[i];
			const isLast = i === parts.length - 1;
			acc = acc ? `${acc}/${part}` : part;
			if (isLast) {
				(parent.children as TreeNode[]).push({
					key: acc,
					name: part,
					isDir: false,
					path: f.path,
				});
			} else {
				parent = ensureDir(parent, part, acc);
			}
		}
	}

	function sortRecursively(nodes: TreeNode[]): TreeNode[] {
		nodes.sort((a, b) =>
			a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
		);
		nodes.forEach((n) => {
			if (n.children) sortRecursively(n.children);
		});
		return nodes;
	}

	return sortRecursively(root.children as TreeNode[]);
}

function TreeNodeView({
	node,
	depth,
	selectedFilePath,
	onSelectFile,
}: {
	node: TreeNode;
	depth: number;
	selectedFilePath: string;
	onSelectFile: (path: string) => void;
}) {
	const [open, setOpen] = useState(depth <= 1);

	if (!node.isDir) {
		const isActive = node.path === selectedFilePath;
		return (
			<button
				type="button"
				className={cn(
					"w-full text-left px-2 py-1 rounded hover:bg-accent",
					isActive && "bg-accent",
				)}
				style={{ paddingLeft: `${8 + depth * 12}px` }}
				onClick={() => node.path && onSelectFile(node.path)}
			>
				<span className="inline-flex items-center gap-2 font-mono text-xs truncate">
					<FileIcon className="h-3 w-3" />
					{node.name}
				</span>
			</button>
		);
	}

	return (
		<div>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
			>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="w-full text-left px-2 py-1 rounded hover:bg-accent"
						style={{ paddingLeft: `${8 + depth * 12}px` }}
					>
						<span className="inline-flex items-center gap-2 font-mono text-xs truncate">
							<ChevronRight className="h-3 w-3 transition-transform" />
							<FolderIcon className="h-3 w-3" />
							{node.name}
						</span>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="space-y-0.5">
						{(node.children ?? []).map((child) => (
							<TreeNodeView
								key={child.key}
								node={child}
								depth={depth + 1}
								selectedFilePath={selectedFilePath}
								onSelectFile={onSelectFile}
							/>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
