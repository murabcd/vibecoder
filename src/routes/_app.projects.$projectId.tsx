import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
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

	// Read optional generate param directly from URL or sessionStorage ONCE
	const { generateFromUrl, generateParam } = useMemo(() => {
		try {
			const usp = new URLSearchParams(window.location.search);
			const g = usp.get("generate") ?? undefined;
			const s = sessionStorage.getItem("vc:initialDescription") ?? undefined;
			if (s) sessionStorage.removeItem("vc:initialDescription");
			return {
				generateFromUrl: g,
				generateParam: (g ?? s) as string | undefined,
			};
		} catch {
			return {
				generateFromUrl: undefined as string | undefined,
				generateParam: undefined as string | undefined,
			};
		}
	}, []);

	const project = useQuery(api.projects.get, {
		id: projectId as Id<"projects">,
	});

	if (project === null) {
		return <NotFound />;
	}

	// Clean URL only if we used an URL param (sessionStorage needs no cleanup)
	if (search.autostart || generateFromUrl) {
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
			projectId={projectId}
			autostart={!!search.autostart}
			defaultVersion={search.version}
			initialDescription={generateParam}
		/>
	);
}
