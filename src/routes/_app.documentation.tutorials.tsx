import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documentation/tutorials")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Tutorials</div>;
}