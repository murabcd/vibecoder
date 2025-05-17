import { Eye, Code2, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface CodePreviewProps {
  displayMode: "preview" | "code";
  setDisplayMode: (mode: "preview" | "code") => void;
  generatedAppCode: string | null;
  isGeneratingCode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function CodePreview({
  displayMode,
  setDisplayMode,
  generatedAppCode,
  isGeneratingCode,
  iframeRef,
}: CodePreviewProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="relative h-[calc(100vh-6rem)] w-full border rounded-lg bg-card flex items-center justify-center">
        {isGeneratingCode && !generatedAppCode ? (
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin mb-2" />
            <p>Generating code...</p>
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
          <div className="h-full w-full bg-card overflow-hidden">
            <ScrollArea className="h-full">
              <pre className="p-4 text-sm whitespace-pre-wrap break-all text-muted-foreground">
                {generatedAppCode}
              </pre>
            </ScrollArea>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm p-1 shadow-md rounded-md">
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
    </div>
  );
}
