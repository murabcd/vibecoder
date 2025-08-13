import { useEffect, useRef, useState } from "react";
import { X, Code2, Eye } from "lucide-react";

import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";

import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerClose,
} from "@/components/ui/drawer";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface MobileCodeDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	generatedAppCode: string | null;
	previewUrl: string | null;
}

export default function MobileCodeDrawer({
	isOpen,
	onClose,
	generatedAppCode,
	previewUrl,
}: MobileCodeDrawerProps) {
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorViewRef = useRef<EditorView | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isCodeReady, setIsCodeReady] = useState(false);
	const [displayMode, setDisplayMode] = useState<"preview" | "code">("preview");

	useEffect(() => {
		if (
			isOpen &&
			displayMode === "code" &&
			editorContainerRef.current &&
			!editorViewRef.current &&
			generatedAppCode
		) {
			const startState = EditorState.create({
				doc: generatedAppCode,
				extensions: [
					basicSetup,
					html(),
					oneDark,
					EditorView.editable.of(false),
					EditorView.theme({
						"&": {
							height: "100%",
						},
						".cm-scroller": {
							overflow: "auto",
						},
						".cm-content": {
							whiteSpace: "pre",
						},
						".cm-gutters": {
							fontSize: "0.875rem",
						},
						".cm-line": {
							fontSize: "0.875rem",
						},
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
				view?.destroy();
				editorViewRef.current = null;
				setIsCodeReady(false);
			};
		}
	}, [isOpen, displayMode, generatedAppCode]);

	useEffect(() => {
		if (
			isOpen &&
			displayMode === "code" &&
			editorViewRef.current &&
			generatedAppCode &&
			isCodeReady
		) {
			const currentDoc = editorViewRef.current.state.doc.toString();
			if (currentDoc !== generatedAppCode) {
				editorViewRef.current.dispatch({
					changes: { from: 0, to: currentDoc.length, insert: generatedAppCode },
				});
			}
		}
	}, [generatedAppCode, isOpen, displayMode, isCodeReady]);

	// Clean up editor when drawer closes or mode changes
	useEffect(() => {
		if ((!isOpen || displayMode === "preview") && editorViewRef.current) {
			editorViewRef.current.destroy();
			editorViewRef.current = null;
			setIsCodeReady(false);
		}
	}, [isOpen, displayMode]);

	// Update iframe when preview mode is active
	useEffect(() => {
		if (iframeRef.current && isOpen && displayMode === "preview") {
			iframeRef.current.src = previewUrl ?? "about:blank";
		}
	}, [previewUrl, displayMode, isOpen]);

	return (
		<Drawer open={isOpen} onOpenChange={onClose}>
			<DrawerContent className="h-[85vh]">
				<DrawerHeader>
					<div className="flex items-center justify-between">
						{generatedAppCode && (
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
						)}
						<DrawerClose asChild>
							<button
								type="button"
								onClick={onClose}
								className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
							>
								<X className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</button>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="flex-1 px-4 pb-4 overflow-hidden">
					{generatedAppCode ? (
						displayMode === "preview" ? (
							<iframe
								key={`iframe-${isOpen}-${displayMode}`}
								className="h-full w-full bg-card border rounded-md"
								ref={iframeRef}
								sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
								title="Generated App Preview"
								src={previewUrl ?? "about:blank"}
							/>
						) : (
							<div
								ref={editorContainerRef}
								className="h-full w-full text-sm border rounded-md overflow-hidden"
							/>
						)
					) : (
						<div className="h-full w-full flex items-center justify-center text-muted-foreground">
							<p>No code generated yet</p>
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
