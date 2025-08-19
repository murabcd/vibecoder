import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Calendar,
	Star,
	MoreHorizontal,
	Trash2,
	Share,
	Check,
	Edit3,
} from "lucide-react";
import { RenameModal } from "@/components/rename-modal";

interface ProjectCardProps {
	project: {
		_id: Id<"projects">;
		title: string;
		description: string;
		code: string;
		files: Array<{ path: string; content: string }>;
		previewUrl?: string;
		sandboxId?: string;
		createdAt: number;
		starred?: boolean;
		visibility?: "private" | "public";
	};
	onProjectClick: (project: ProjectCardProps["project"]) => void;
}

export function ProjectCard({ project, onProjectClick }: ProjectCardProps) {
	const removeApp = useMutation(api.projects.remove);
	const toggleStarred = useMutation(api.projects.toggleStarred);

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			await removeApp({ id: project._id });
			toast("Project deleted");
		} catch (error) {
			console.error("Failed to delete project:", error);
			toast.error("Failed to delete project");
		} finally {
			setDeleteDialogOpen(false);
		}
	};

	const handleToggleStarred = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await toggleStarred({ id: project._id });
		} catch (error) {
			console.error("Failed to toggle starred status:", error);
		}
	};

	const handleRename = (e: React.MouseEvent) => {
		e.stopPropagation();
		setRenameDialogOpen(true);
	};

	const handleRenameClose = () => {
		setRenameDialogOpen(false);
	};

	const handleShare = (
		visibility: "private" | "public",
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		if (visibility === "public") {
			// Generate a shareable URL (you might want to create a proper sharing system)
			const shareUrl = `${window.location.origin}/app/${project._id}`;
			navigator.clipboard
				.writeText(shareUrl)
				.then(() => {
					toast("Link copied to clipboard");
				})
				.catch((err) => {
					console.error("Failed to copy link: ", err);
					toast.error("Failed to copy link");
				});
		} else {
			toast("Project is now private");
		}
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<>
			<Card
				className="group relative hover:shadow-md transition-shadow cursor-pointer"
				onClick={() => onProjectClick(project)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onProjectClick(project);
					}
				}}
				tabIndex={0}
				aria-label={`Open project: ${project.title}`}
			>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							{project.starred && (
								<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
							)}
						</div>
						<div className="flex items-center gap-2">
							{project.visibility && (
								<Badge
									variant={
										project.visibility === "public" ? "default" : "secondary"
									}
								>
									{project.visibility}
								</Badge>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">More</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-48 rounded-lg">
									<DropdownMenuSub>
										<DropdownMenuSubTrigger className="cursor-pointer">
											<Share className="h-4 w-4 mr-2 text-muted-foreground" />
											<span>Share</span>
										</DropdownMenuSubTrigger>
										<DropdownMenuPortal>
											<DropdownMenuSubContent>
												<DropdownMenuItem
													className="cursor-pointer flex-row justify-between"
													onClick={(e) => handleShare("private", e)}
												>
													Private
													{project.visibility === "private" ? (
														<Check className="w-4 h-4" />
													) : null}
												</DropdownMenuItem>
												<DropdownMenuItem
													className="cursor-pointer flex-row justify-between"
													onClick={(e) => handleShare("public", e)}
												>
													Public
													{project.visibility === "public" ? (
														<Check className="w-4 h-4" />
													) : null}
												</DropdownMenuItem>
											</DropdownMenuSubContent>
										</DropdownMenuPortal>
									</DropdownMenuSub>
									<DropdownMenuItem onClick={(e) => handleRename(e)}>
										<Edit3 className="h-4 w-4 text-muted-foreground" />
										<span>Rename</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={(e) => handleToggleStarred(e)}>
										<Star
											className={`text-muted-foreground ${project.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
										/>
										<span>{project.starred ? "Unfavorite" : "Favorite"}</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => handleDelete(e)}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="text-destructive" />
										<span>Delete</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-0">{/* Empty content area */}</CardContent>
				<CardContent className="pt-0">
					<div className="space-y-1">
						<CardTitle className="text-sm line-clamp-2">
							{project.title}
						</CardTitle>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Calendar className="h-3 w-3" />
							{formatDate(project.createdAt)}
						</div>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							project and remove your data from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<RenameModal
				isOpen={renameDialogOpen}
				onClose={handleRenameClose}
				id={project._id}
				title={project.title}
			/>
		</>
	);
}
