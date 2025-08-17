import { createFileRoute } from "@tanstack/react-router";
import VibeCoder from "@/components/coder";

export const Route = createFileRoute("/_app/")({
	component: VibeCoder,
});
