import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documentation/changelog")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Changelog</div>;
}