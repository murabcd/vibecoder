import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects/all")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>All Projects view</div>;
}
