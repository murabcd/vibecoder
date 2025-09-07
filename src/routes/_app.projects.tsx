import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-auto">
				<Outlet />
			</div>
		</div>
	);
}
