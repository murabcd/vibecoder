import { createServerFileRoute } from "@tanstack/react-start/server";
import { getModelId, modelRealtimeMini } from "../../lib/ai/models";

export const ServerRoute = createServerFileRoute("/api/session").methods({
  GET: async () => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/realtime/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: getModelId(modelRealtimeMini),
          }),
        }
      );
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in /api/session:", error);
      return new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});