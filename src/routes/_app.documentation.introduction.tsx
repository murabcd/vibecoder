import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documentation/introduction")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Introduction to VibeCoder</div>;
}