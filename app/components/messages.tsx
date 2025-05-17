import React, { useRef, useEffect } from "react";

import { AudioLines, Square, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusBar from "@/components/status-bar";
import { cn } from "@/lib/utils";

export interface MessagesProps {
  inputText: string;
  setInputText: (val: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  status: string;
}

function Messages({
  inputText,
  setInputText,
  isListening,
  onToggleListening,
  status,
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
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isListening}
            className="rounded-full disabled:opacity-50"
            aria-label="Send message"
          >
            <ArrowUp size={20} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onToggleListening}
            className="rounded-full"
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <Square size={20} /> : <AudioLines size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Messages;
