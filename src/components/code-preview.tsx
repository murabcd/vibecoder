import React, { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";

import { Eye, Code2, Loader } from "lucide-react";

import { cn } from "@/lib/utils";

import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";

import Console, { ConsoleOutput } from "@/components/console";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CodePreviewProps {
  displayMode: "preview" | "code";
  setDisplayMode: (mode: "preview" | "code") => void;
  generatedAppCode: string | null;
  isGeneratingCode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
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
  iframeRef,
  consoleOutputs,
  setConsoleOutputs,
  onClearConsole,
}: CodePreviewProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [isCodeReady, setIsCodeReady] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  useEffect(() => {
    if (
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
        view.destroy();
        editorViewRef.current = null;
        setIsCodeReady(false);
      };
    }
  }, [displayMode, generatedAppCode]);

  useEffect(() => {
    if (
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
  }, [generatedAppCode, displayMode, isCodeReady]);

  return (
    <div className="hidden md:flex flex-1 flex-col min-w-0 max-h-[calc(100vh-7rem)] border rounded-md bg-card overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-grow relative overflow-auto">
          {isGeneratingCode && !generatedAppCode ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader size={24} className="animate-spin mb-2" />
              <p>Generating...</p>
            </div>
          ) : displayMode === "preview" ? (
            <iframe
              className="h-full w-full bg-card"
              ref={iframeRef}
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
              title="Generated App"
              src="about:blank"
            />
          ) : (
            <div ref={editorContainerRef} className="h-full w-full text-sm" />
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

        <Console
          consoleOutputs={consoleOutputs}
          setConsoleOutputs={setConsoleOutputs}
          isVisible={true}
          isExpanded={isConsoleExpanded}
          onToggleExpand={() => setIsConsoleExpanded((prev) => !prev)}
          onClearConsole={onClearConsole}
          className={cn(
            "flex-shrink-0",
            isConsoleExpanded ? CONSOLE_EXPANDED_CONTENT_HEIGHT : CONSOLE_HEADER_HEIGHT
          )}
        />
      </div>
    </div>
  );
}
