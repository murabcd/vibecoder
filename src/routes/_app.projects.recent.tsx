import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects/recent")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Recent Projects</div>;
}
