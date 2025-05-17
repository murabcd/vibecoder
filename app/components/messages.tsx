import React, { useRef, useEffect } from "react";

import { AudioLines, Square, ArrowUp, Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import StatusBar from "@/components/status-bar";
import { cn } from "@/lib/utils";

export interface MessagesProps {
  inputText: string;
  setInputText: (val: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  status: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

function Messages({
  inputText,
  setInputText,
  isListening,
  onToggleListening,
  status,
  isMuted,
  onToggleMute,
}: MessagesProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const minPixelHeight = 98;
      textareaRef.current.style.height = "auto";
      const scrollBasedHeight = textareaRef.current.scrollHeight;
      const targetHeight = Math.max(minPixelHeight, scrollBasedHeight);
      const maxHeight = window.innerHeight * 0.5;
      textareaRef.current.style.height = `${Math.min(targetHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      console.log("Sending message:", inputText);
      // Implement actual message sending logic here if needed
    }
  };

  return (
    <div className="flex flex-col gap-0">
      {status && <StatusBar status={status} />}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          id="followUpInputArea"
          className="w-full resize-none overflow-y-auto text-sm bg-muted pr-24 dark:border-zinc-700 border border-input rounded-2xl min-h-[98px]"
          placeholder="Ask a follow up..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          readOnly={isListening}
          rows={4}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <div className="absolute bottom-3 left-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleMute}
                disabled={!isListening}
                className="rounded-full"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMuted ? "Unmute" : "Mute"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isListening}
                className="rounded-full disabled:opacity-50"
                aria-label="Send message"
              >
                <ArrowUp size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="default"
                onClick={onToggleListening}
                className="rounded-full"
                aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? <Square size={20} /> : <AudioLines size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isListening ? "Stop listening" : "Start listening"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default Messages;
