import { createFileRoute } from "@tanstack/react-router";
import VibeCoderComponent from "@/components/chat";

export const Route = createFileRoute("/")({
  component: VibeCoderComponent,
});
