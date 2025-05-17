import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback } from "react";

import { Session } from "@/lib/session";
import { vibeCoderPrompt, appGenerationPrompt } from "@/lib/ai/prompts";
import { getModelId, modelRealtimeMini } from "@/lib/ai/models";

import Header from "@/components/header";
import CodeViewer from "@/components/code-viewer";
import CodeInstruction from "@/components/code-instruction";

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
      model: "gpt-4o-mini",
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

export const Route = createFileRoute("/chat")({
  component: VibeCoderComponent,
});

function VibeCoderComponent() {
  const [status, setStatus] = useState("Ready.");
  const [currentAppDescription, setCurrentAppDescription] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [generatedAppCode, setGeneratedAppCode] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<"preview" | "code">("preview");

  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const triggerAppGeneration = useCallback(async (description: string) => {
    if (!description.trim()) {
      setStatus("App description is empty, cannot generate.");
      return;
    }
    setStatus("Generating app code...");
    setGeneratedAppCode(null);
    setFollowUpText("");
    if (iframeRef.current) iframeRef.current.src = "about:blank";
    try {
      const code = await generateAppOnServer({ data: description });
      setGeneratedAppCode(code);
      setStatus("App generated successfully!");
    } catch (error) {
      console.error("Failed to generate app:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Error generating app: ${msg}`);
    }
  }, []);

  const startVoiceSession = async () => {
    if (!OPENAI_API_KEY) {
      alert(
        "OpenAI API Key is not configured. Please set VITE_OPENAI_API_KEY in your .env file or an equivalent setup."
      );
      setStatus("Error: API Key not configured.");
      return;
    }
    if (sessionRef.current) return;

    try {
      setStatus("Initializing audio stream...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setStatus("Starting voice session...");
      setCurrentAppDescription("");
      const newSession = new Session(OPENAI_API_KEY);
      sessionRef.current = newSession;

      newSession.onopen = () => {
        setStatus("Voice session connected. Listening for app description...");
        setIsListening(true);
        newSession.sendMessage({ type: "response.create" });
      };

      newSession.onmessage = (msg: any) => {
        console.log("Session message:", msg);
        if (msg.type === "transcript") {
          if (msg.transcript && msg.is_final) {
            setCurrentAppDescription((prev) => (prev + msg.transcript + " ").trim());
          } else if (msg.transcript) {
          }
        }
        if (
          msg.type === "response.function_call_arguments.done" &&
          msg.name === "create_app"
        ) {
          try {
            const args = JSON.parse(msg.arguments);
            const description = args.description;
            if (description) {
              setCurrentAppDescription(description);
              setStatus("Received app description from AI, generating...");
              triggerAppGeneration(description);
            }
          } catch (e) {
            console.error("Error parsing function call arguments:", e);
            setStatus("Error processing AI command.");
          }
        }
      };

      newSession.ontrack = (e: RTCTrackEvent) => {
        console.log("Audio track received from session");
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        if (e.streams && e.streams[0]) {
          audioRef.current.srcObject = e.streams[0];
          audioRef.current
            .play()
            .catch((err) => console.error("Error playing AI audio:", err));
        }
      };

      newSession.onerror = (err: any) => {
        console.error("Session error:", err);
        setStatus(`Voice Error: ${err.message || "Unknown error"}`);
        stopVoiceSession();
      };

      newSession.onconnectionstatechange = (state: RTCPeerConnectionState) => {
        console.log("Connection state:", state);
        setStatus(`Voice connection: ${state}`);
        if (state === "failed" || state === "closed" || state === "disconnected") {
          stopVoiceSession();
        }
      };

      await newSession.start(stream, vibeCoderSessionParams);
    } catch (error) {
      console.error("Failed to start voice session:", error);
      const msg =
        error instanceof Error ? error.message : "Unknown error starting voice session";
      setStatus(`Error: ${msg}`);
      setIsListening(false);
    }
  };

  const stopVoiceSession = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    setIsListening(false);
    setIsMuted(false);
    setStatus("Voice session stopped. Ready to start.");
  };

  const toggleMute = () => {
    if (sessionRef.current) {
      const newMutedState = !isMuted;
      sessionRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
      setStatus(newMutedState ? "Microphone Muted" : "Microphone Unmuted");
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

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
      <Header isListening={isListening} isMuted={isMuted} onToggleMute={toggleMute} />

      <div className="p-2 flex-grow flex flex-col">
        <div className="flex flex-1 overflow-hidden gap-1">
          <CodeInstruction
            currentAppDescription={currentAppDescription}
            followUpText={followUpText}
            setFollowUpText={setFollowUpText}
            isListening={isListening}
            status={status}
            startVoiceSession={startVoiceSession}
            stopVoiceSession={stopVoiceSession}
          />
          <CodeViewer
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            generatedAppCode={generatedAppCode}
            iframeRef={iframeRef}
          />
        </div>
      </div>
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}
