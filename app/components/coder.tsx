import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback } from "react";

import { Session } from "@/lib/session";

import { useVoiceSession } from "@/hooks/use-voice-session";

import {
  vibeCoderPrompt,
  appGenerationPrompt,
  appRefinemenPrompt,
} from "@/lib/ai/prompts";
import { getModelId, modelChat, modelRealtimeMini } from "@/lib/ai/models";

import Header from "@/components/header";
import CodePreview from "@/components/code-preview";
import CodeInstruct from "@/components/code-instruct";
import { ConsoleOutput } from "@/components/console";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const API_BASE = "https://api.openai.com/v1";

const vibeCoderSessionParams = {
  instructions: vibeCoderPrompt,
  model: getModelId(modelRealtimeMini),
  voice: "shimmer",
  tools: [
    {
      type: "function",
      name: "create_app",
      description: "Use this function to create a new app with the given description.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "The description of the app to create.",
          },
        },
        required: ["description"],
      },
    },
  ],
};

const generateAppOnServer = createServerFn({ method: "POST" })
  .validator((description: string): string => {
    if (typeof description !== "string" || description.trim() === "") {
      throw new Error("App description cannot be empty.");
    }
    return description;
  })
  .handler(async ({ data: appDescription }: { data: string }) => {
    if (!OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file."
      );
    }
    const payload = {
      model: getModelId(modelChat),
      messages: [
        { role: "system", content: appGenerationPrompt },
        { role: "user", content: appDescription },
      ],
    };
    try {
      const response = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("OpenAI API Error:", response.status, errorBody);
        throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
      }
      const data = await response.json();
      const content =
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content;
      if (!content) {
        throw new Error("Invalid API response format from OpenAI (no content).");
      }
      const regex = /```(?:html)?\n([\s\S]*?)```/;
      const match = regex.exec(content);
      const code = match ? match[1].trim() : null;
      if (!code) {
        console.error("Could not extract code from API response. Raw content:", content);
        throw new Error("Could not extract HTML code from OpenAI response.");
      }
      return code;
    } catch (error) {
      console.error("Error in generateAppOnServer:", error);
      if (error instanceof Error) throw error;
      throw new Error("An unexpected error occurred while generating the app.");
    }
  });

export default function VibeCoder() {
  const [status, setStatus] = useState("Click the voice button to start coding.");
  const [currentAppDescription, setCurrentAppDescription] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [generatedAppCode, setGeneratedAppCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [displayMode, setDisplayMode] = useState<"preview" | "code">("preview");
  const [error, setError] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [consoleOutputs, setConsoleOutputs] = useState<Array<ConsoleOutput>>([]);

  const appendToConsole = useCallback(
    (
      type: ConsoleOutput["contents"][0]["type"],
      value: string,
      consoleStatus: ConsoleOutput["status"] = "completed"
    ) => {
      setConsoleOutputs((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          status: consoleStatus,
          contents: [{ type, value }],
        },
      ]);
    },
    []
  );

  const handleClearConsole = useCallback(() => {
    setConsoleOutputs([]);
  }, []);

  const triggerAppGeneration = useCallback(
    async (description: string) => {
      if (!description.trim()) {
        setStatus("App description cannot be empty.");
        appendToConsole("error", "App description cannot be empty.", "failed");
        return;
      }
      setStatus("Generating your app...");
      setIsGeneratingCode(true);
      setGeneratedAppCode(null);
      setFollowUpText("");
      setError(null);
      if (iframeRef.current) iframeRef.current.src = "about:blank";
      appendToConsole("info", "App generation initiated.");

      try {
        const code = await generateAppOnServer({ data: description });
        setGeneratedAppCode(code);
        setStatus("App generated successfully! Previewing now.");
        appendToConsole("info", "App generated successfully.");
      } catch (e) {
        console.error("Failed to generate app:", e);
        const msg = e instanceof Error ? e.message : "Unknown error";
        setStatus(`Error generating app: ${msg}`);
        setError(msg);
        appendToConsole("error", `Error generating app: ${msg}`, "failed");
      } finally {
        setIsGeneratingCode(false);
      }
    },
    [appendToConsole]
  );

  const handleStatusUpdate = useCallback((newStatus: string) => {
    setStatus(newStatus);
  }, []);

  const handleTranscriptReceived = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal && transcript) {
      setCurrentAppDescription((prev) => (prev + transcript + " ").trim());
    } else if (transcript) {
    }
  }, []);

  const handleFunctionCallArguments = useCallback(
    (name: string, args: any) => {
      if (name === "create_app") {
        const description = args.description;
        if (description) {
          setCurrentAppDescription(description);
          setStatus("Received app description. Generating your app...");
          triggerAppGeneration(description);
        }
      } else {
        console.warn("Received unhandled function call from AI:", name, args);
      }
    },
    [triggerAppGeneration]
  );

  const handleVoiceConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState) => {
      setStatus(
        (prevStatus) =>
          `Voice connection: ${state}. ${prevStatus.replace(/^Voice connection: [^.]+\. /, "")}`
      );
    },
    []
  );

  const handleVoiceError = useCallback(
    (e: any) => {
      const msg = e instanceof Error ? e.message : "Unknown voice error";
      setStatus(
        (prevStatus) =>
          `Voice Error: ${msg}. ${prevStatus.replace(/^Voice Error: [^.]+\. /, "")}`
      );
      appendToConsole("error", `Voice Error: ${msg}`, "failed");
    },
    [appendToConsole]
  );

  const {
    isListening: voiceSessionIsListening,
    isMuted: voiceSessionIsMuted,
    startListening,
    stopListening,
    toggleMute,
    audioRef: voiceSessionAudioRef,
  } = useVoiceSession({
    openAIApiKey: OPENAI_API_KEY,
    sessionParams: vibeCoderSessionParams,
    onStatusUpdate: handleStatusUpdate,
    onTranscriptReceived: handleTranscriptReceived,
    onFunctionCallArguments: handleFunctionCallArguments,
    onConnectionStateChange: handleVoiceConnectionStateChange,
    onError: handleVoiceError,
  });

  const handleFollowUpSubmit = async (message: string) => {
    if (!generatedAppCode) {
      setStatus("Please generate an app first before refining.");
      appendToConsole("error", "Cannot refine: No app generated yet.", "failed");
      return;
    }
    if (!message.trim()) {
      setStatus("Follow-up instruction cannot be empty.");
      appendToConsole("error", "Follow-up instruction cannot be empty.", "failed");
      return;
    }

    setStatus("Refining your app based on instructions...");
    setIsGeneratingCode(true);
    setError(null);
    appendToConsole("info", "Refinement process started.");

    const refinementDescription = appRefinemenPrompt(generatedAppCode, message);

    try {
      const refinedCode = await generateAppOnServer({ data: refinementDescription });
      setGeneratedAppCode(refinedCode);
      setStatus("App refined successfully! Previewing updates.");
      appendToConsole("info", "App refined successfully.");
    } catch (e) {
      console.error("Failed to refine app using generateAppOnServer:", e);
      const msg = e instanceof Error ? e.message : "Unknown error during refinement";
      setStatus(`Error refining app: ${msg}`);
      setError(msg);
      appendToConsole("error", `Error refining app: ${msg}`, "failed");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  useEffect(() => {
    if (iframeRef.current) {
      if (displayMode === "preview" && generatedAppCode) {
        iframeRef.current.src =
          "data:text/html;charset=utf-8," + encodeURIComponent(generatedAppCode);
      } else if (displayMode === "preview" && !generatedAppCode) {
        iframeRef.current.src = "about:blank";
      }
    }
  }, [generatedAppCode, displayMode]);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="p-2 flex-grow flex flex-col">
        <div
          className={`flex flex-1 overflow-hidden ${
            isGeneratingCode || generatedAppCode ? "gap-2" : "justify-center"
          }`}
        >
          <CodeInstruct
            currentAppDescription={currentAppDescription}
            followUpText={followUpText}
            setFollowUpText={setFollowUpText}
            isListening={voiceSessionIsListening}
            status={status}
            startVoiceSession={startListening}
            stopVoiceSession={stopListening}
            isGeneratingCode={isGeneratingCode}
            generatedAppCode={generatedAppCode}
            isMuted={voiceSessionIsMuted}
            onToggleMute={toggleMute}
            onSendMessage={handleFollowUpSubmit}
          />
          {(isGeneratingCode || generatedAppCode) && (
            <CodePreview
              displayMode={displayMode}
              setDisplayMode={setDisplayMode}
              generatedAppCode={generatedAppCode}
              isGeneratingCode={isGeneratingCode}
              iframeRef={iframeRef}
              consoleOutputs={consoleOutputs}
              setConsoleOutputs={setConsoleOutputs}
              onClearConsole={handleClearConsole}
            />
          )}
        </div>
      </div>
      <audio ref={voiceSessionAudioRef} style={{ display: "none" }} />
    </div>
  );
}
