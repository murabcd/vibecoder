import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import VibeCoder from "@/components/coder";

export const Route = createFileRoute("/_app/projects/$projectId")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			from: (search.from as string) || "all",
		};
	},
});

function RouteComponent() {
	const { projectId } = Route.useParams();

	const project = useQuery(api.projects.get, {
		id: projectId as Id<"projects">,
	});

	if (project === null) {
		return <div>Project not found</div>;
	}

	return <VibeCoder key={projectId} project={project} />;
}
