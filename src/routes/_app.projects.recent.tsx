import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Clock } from "lucide-react";
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

export const Route = createFileRoute("/_app/projects/recent")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const allProjects = useQuery(api.histories.list) ?? [];

	// Show only the 12 most recent projects
	const recentProjects = allProjects
		.sort((a, b) => b.createdAt - a.createdAt)
		.slice(0, 12);

	const handleProjectClick = (app: AppHistoryItem) => {
		// Navigate to project-specific route
		navigate({
			to: "/projects/$projectId",
			params: { projectId: app._id },
			search: { from: "recent" },
		});
	};

	return (
		<div className="flex-1 space-y-4 p-4 pt-6">
			{recentProjects.length === 0 ? (
				<div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
					<EmptyState
						icon={Clock}
						title="No recent projects"
						description="Your recently created projects will appear here."
						actionLabel="Create project"
						onAction={() => navigate({ to: "/" })}
					/>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{recentProjects.map((app) => (
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
