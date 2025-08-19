import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project-card";

interface AppHistoryItem {
	_id: Id<"histories">;
	title: string;
	description: string;
	code: string;
	files: Array<{ path: string; content: string }>;
	previewUrl?: string;
	sandboxId?: string;
	createdAt: number;
	starred?: boolean;
	visibility?: "private" | "public";
}

export const Route = createFileRoute("/_app/projects/all")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const appHistory = useQuery(api.histories.list) ?? [];

	const handleProjectClick = (app: AppHistoryItem) => {
		navigate({
			to: `/projects/${app._id}`,
			search: { from: "all" },
		});
	};

	return (
		<div className="flex-1 space-y-4 p-4 pt-6">
			{appHistory.length === 0 ? (
				<div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
					<EmptyState
						icon={FolderOpen}
						title="No projects yet"
						description="Create your first project to get started with VibeCoder."
						actionLabel="Create project"
						onAction={() => navigate({ to: "/" })}
					/>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{appHistory.map((app) => (
						<ProjectCard
							key={app._id}
							project={app}
							onProjectClick={handleProjectClick}
						/>
					))}
				</div>
			)}
		</div>
	);
}
