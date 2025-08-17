import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documentation/get-started")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Get started Guide</div>;
}