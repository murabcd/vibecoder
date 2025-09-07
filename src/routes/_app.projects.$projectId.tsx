import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import VibeCoder from "@/components/coder";
import { NotFound } from "@/components/not-found";

export const Route = createFileRoute("/_app/projects/$projectId")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			from: (search.from as string) || "all",
			// Optional autostart flag to begin voice session on arrival
			autostart: Boolean(search.autostart),
			// Optional version number to preselect in the UI
			version:
				typeof search.version === "string"
					? Number.parseInt(search.version, 10)
					: typeof search.version === "number"
						? (search.version as number)
						: undefined,
		};
	},
});

function RouteComponent() {
	const { projectId } = Route.useParams();
	const search = Route.useSearch();
	const router = useRouter();

	const project = useQuery(api.projects.get, {
		id: projectId as Id<"projects">,
	});

	if (project === null) {
		return <NotFound />;
	}

	// If autostart is present, strip it from the URL after initial render to avoid
	// re-triggering on refresh/navigation. Coder component will still receive the
	// initial autostart prop during first mount.
	if (search.autostart) {
		// Fire-and-forget; the component render proceeds while we clean the URL.
		void router.navigate({
			to: `/projects/${projectId}`,
			search: { from: search.from, version: search.version },
			replace: true,
		});
	}

	return (
		<VibeCoder
			key={projectId}
			project={project}
			autostart={!!search.autostart}
			defaultVersion={search.version}
		/>
	);
}
