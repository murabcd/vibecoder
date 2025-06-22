import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { Terminal, LoaderCircle, ChevronsDown, ChevronsUp, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface ConsoleOutputContent {
  type: "text" | "error" | "info";
  value: string;
}

export interface ConsoleOutput {
  id: string;
  status: "in_progress" | "loading_pyodide" | "loading_micropip" | "completed" | "failed";
  contents: Array<ConsoleOutputContent>;
}

interface ConsoleProps {
  consoleOutputs: Array<ConsoleOutput>;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClearConsole?: () => void;
  className?: string;
}

export default function Console({
  consoleOutputs,
  setConsoleOutputs,
  isVisible,
  isExpanded,
  onToggleExpand,
  onClearConsole,
  className,
}: ConsoleProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && isExpanded && consoleOutputs.length > 0) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleOutputs, isVisible, isExpanded]);

  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-50 dark:bg-zinc-900 border-t dark:border-zinc-700 border-zinc-200 w-full",
        className
      )}
    >
      <div className="flex flex-row justify-between items-center w-full h-fit border-b dark:border-zinc-700 border-zinc-200 px-2 py-1 sticky top-0 z-10 bg-muted select-none">
        <div className="flex flex-row items-center gap-2 text-sm dark:text-zinc-50 text-zinc-800">
          <div className="text-muted-foreground pl-1">
            <Terminal size={20} />
          </div>
          <div>Console</div>
        </div>

        <div className="flex items-center gap-1 mr-1">
          {onClearConsole && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClearConsole}
                  className="p-1 h-auto w-auto hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-sm"
                  aria-label="Clear console"
                >
                  <Trash2 size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear console</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
                className="p-1 h-auto w-auto hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-sm"
                aria-label={isExpanded ? "Hide console" : "Show console"}
              >
                {isExpanded ? <ChevronsDown size={20} /> : <ChevronsUp size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? "Hide console" : "Show console"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-y-auto flex-grow">
          {consoleOutputs.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center items-center justify-center">
              No console messages.
            </div>
          )}
          {consoleOutputs.map((consoleOutput, index) => (
            <div
              key={consoleOutput.id}
              className="px-4 py-2 flex flex-row text-sm border-b dark:border-zinc-700 border-zinc-200 font-mono last:border-b-0"
            >
              <div
                className={cn("w-12 shrink-0", {
                  "text-muted-foreground": [
                    "in_progress",
                    "loading_pyodide",
                    "loading_micropip",
                  ].includes(consoleOutput.status),
                  "text-emerald-500": consoleOutput.status === "completed",
                  "text-red-400": consoleOutput.status === "failed",
                })}
              >
                [{index + 1}]
              </div>
              {["in_progress", "loading_pyodide", "loading_micropip"].includes(
                consoleOutput.status
              ) ? (
                <div className="flex flex-row gap-2 items-center">
                  <div className="animate-spin size-fit">
                    <LoaderCircle className="w-4 h-4" />
                  </div>
                  <div className="text-muted-foreground">
                    {consoleOutput.status === "in_progress"
                      ? "Processing..."
                      : consoleOutput.status === "loading_pyodide" ||
                          consoleOutput.status === "loading_micropip"
                        ? consoleOutput.contents
                            .map((content) =>
                              content.type === "text" ? content.value : null
                            )
                            .join("")
                        : "Loading..."}
                  </div>
                </div>
              ) : (
                <div className="dark:text-zinc-50 text-zinc-900 w-full flex flex-col gap-1 overflow-x-auto">
                  {consoleOutput.contents.map((content, cIndex) => (
                    <div
                      key={`${consoleOutput.id}-${cIndex}`}
                      className={cn("whitespace-pre-wrap break-words w-full", {
                        "text-red-500": content.type === "error",
                        "text-blue-500": content.type === "info",
                      })}
                    >
                      {content.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      )}
    </div>
  );
}
