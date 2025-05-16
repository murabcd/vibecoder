import React, { useRef, useEffect } from "react";

import { AudioLines, Square, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
      textareaRef.current.style.height = "auto";
      const maxHeight = window.innerHeight * 0.5;
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
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
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-grow"></div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          id="followUpInputArea"
          className="w-full resize-none overflow-y-auto rounded-2xl text-sm bg-muted pr-24 dark:border-zinc-700 border border-input"
          placeholder="Ask a follow up..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          readOnly={isListening}
          rows={2}
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
            onClick={onToggleListening}
            className="rounded-full"
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <Square size={20} /> : <AudioLines size={20} />}
          </Button>
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isListening}
            className="rounded-full disabled:opacity-50"
            aria-label="Send message"
          >
            <ArrowUp size={20} />
          </Button>
        </div>
      </div>
      {status && (
        <p className="mt-1 text-xs text-muted-foreground italic text-center">
          Status: {status}
        </p>
      )}
    </div>
  );
}

export default Messages;
