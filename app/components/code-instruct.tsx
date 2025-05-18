import { cn } from "@/lib/utils";

import MessageInput from "@/components/message-input";
import Greeting from "@/components/greeting";

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
}: CodeInstructProps) {
  const handleToggleListening = () => {
    if (isListening) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  const isActive = isGeneratingCode || generatedAppCode;

  return (
    <div
      className={cn(
        "flex flex-col h-full justify-between",
        isActive
          ? "w-full md:w-[400px] px-2 pb-4 md:pb-6"
          : "w-full md:max-w-3xl px-4 pb-4 md:pb-6"
      )}
    >
      <div className={cn(!isActive && "pt-48")}>
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
      <MessageInput
        inputText={followUpText}
        setInputText={setFollowUpText}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        status={status}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
