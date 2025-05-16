import { Eye, Code2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface CodeViewerProps {
  displayMode: "preview" | "code";
  setDisplayMode: (mode: "preview" | "code") => void;
  generatedAppCode: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function CodeViewer({
  displayMode,
  setDisplayMode,
  generatedAppCode,
  iframeRef,
}: CodeViewerProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="relative flex-1 min-h-0">
        {displayMode === "preview" ? (
          <iframe
            className="h-full w-full border rounded-lg bg-card"
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
            title="Generated App"
            src="about:blank"
          />
        ) : (
          <ScrollArea className="h-full w-full border rounded-lg bg-card">
            <pre className="p-4 text-sm whitespace-pre-wrap break-all h-full text-muted-foreground">
              {generatedAppCode}
            </pre>
          </ScrollArea>
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
