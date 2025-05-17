import Messages from "@/components/messages";
import Greeting from "@/components/greeting";

interface CodeInstructionProps {
  currentAppDescription: string;
  followUpText: string;
  setFollowUpText: (text: string) => void;
  isListening: boolean;
  status: string;
  startVoiceSession: () => Promise<void>;
  stopVoiceSession: () => void;
}

export default function CodeInstruction({
  currentAppDescription,
  followUpText,
  setFollowUpText,
  isListening,
  status,
  startVoiceSession,
  stopVoiceSession,
}: CodeInstructionProps) {
  const handleToggleListening = () => {
    if (isListening) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  return (
    <div className="w-full md:w-[400px] p-4 flex flex-col gap-4">
      <div>
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
      <Messages
        inputText={followUpText}
        setInputText={setFollowUpText}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        status={status}
      />
    </div>
  );
}
