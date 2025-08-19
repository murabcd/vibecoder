import { useState } from "react";
import {
	Code,
	Edit3,
	MoreHorizontal,
	Trash2,
	Share,
	Star,
	Check,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

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
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

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

export function NavProjects() {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const [editingId, setEditingId] = useState<Id<"histories"> | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [appToDelete, setAppToDelete] = useState<AppHistoryItem | null>(null);

	// Convex queries and mutations
	const appHistory = useQuery(api.histories.list) ?? [];
	const removeApp = useMutation(api.histories.remove);
	const updateAppTitle = useMutation(api.histories.updateTitle);
	const toggleStarred = useMutation(api.histories.toggleStarred);

	// Separate favorite and non-favorite apps
	const favoriteApps = appHistory.filter((app) => app.starred);
	const regularApps = appHistory.filter((app) => !app.starred);

	const handleEditStart = (app: AppHistoryItem) => {
		setEditingId(app._id);
		setEditingTitle(app.title);
	};

	const handleEditComplete = async () => {
		if (editingId && editingTitle.trim()) {
			try {
				await updateAppTitle({
					id: editingId,
					title: editingTitle.trim(),
				});
			} catch (error) {
				console.error("Failed to update app title:", error);
			}
		}
		setEditingId(null);
		setEditingTitle("");
	};

	const handleEditCancel = () => {
		setEditingId(null);
		setEditingTitle("");
	};

	const handleDelete = (app: AppHistoryItem) => {
		setAppToDelete(app);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!appToDelete) return;

		try {
			await removeApp({ id: appToDelete._id });
			toast("Project deleted");
		} catch (error) {
			console.error("Failed to delete project:", error);
			toast.error("Failed to delete project");
		} finally {
			setDeleteDialogOpen(false);
			setAppToDelete(null);
		}
	};

	const handleToggleStarred = async (id: Id<"histories">) => {
		try {
			await toggleStarred({ id });
		} catch (error) {
			console.error("Failed to toggle starred status:", error);
		}
	};

	const handleLoadApp = (app: AppHistoryItem) => {
		router.navigate({ to: `/projects/${app._id}` });
	};

	const handleShare = (
		app: AppHistoryItem,
		visibility: "private" | "public",
	) => {
		if (visibility === "public") {
			// Generate a shareable URL (you might want to create a proper sharing system)
			const shareUrl = `${window.location.origin}/app/${app._id}`;
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

	const renderAppList = (
		apps: AppHistoryItem[],
		_showStarred: boolean = false,
	) => (
		<>
			{apps.map((app) => (
				<SidebarMenuItem key={app._id}>
					<SidebarMenuButton asChild>
						<button
							type="button"
							onClick={() => handleLoadApp(app)}
							className="w-full justify-start cursor-pointer"
						>
							<Code className="h-4 w-4" />
							{editingId === app._id ? (
								<Input
									value={editingTitle}
									onChange={(e) => setEditingTitle(e.target.value)}
									onBlur={handleEditComplete}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleEditComplete();
										if (e.key === "Escape") handleEditCancel();
									}}
									className="h-auto p-0 border-0 bg-transparent focus-visible:ring-0 text-sidebar-foreground"
									autoFocus
								/>
							) : (
								<span className="truncate">{app.title}</span>
							)}
						</button>
					</SidebarMenuButton>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuAction showOnHover>
								<MoreHorizontal />
								<span className="sr-only">More</span>
							</SidebarMenuAction>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-48 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align={isMobile ? "end" : "start"}
						>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger className="cursor-pointer">
									<Share className="h-4 w-4 mr-2 text-muted-foreground" />
									<span>Share</span>
								</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent>
										<DropdownMenuItem
											className="cursor-pointer flex-row justify-between"
											onClick={() => handleShare(app, "private")}
										>
											Private
											{app.visibility === "private" ? (
												<Check className="w-4 h-4" />
											) : null}
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer flex-row justify-between"
											onClick={() => handleShare(app, "public")}
										>
											Public
											{app.visibility === "public" ? (
												<Check className="w-4 h-4" />
											) : null}
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
							<DropdownMenuItem onClick={() => handleEditStart(app)}>
								<Edit3 className="text-muted-foreground" />
								<span>Rename</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleToggleStarred(app._id)}>
								<Star
									className={`text-muted-foreground ${app.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
								/>
								<span>{app.starred ? "Unfavorite" : "Favorite"}</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleDelete(app)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="text-destructive" />
								<span>Delete</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			))}
		</>
	);

	return (
		<>
			{/* Favorite Apps Section */}
			{favoriteApps.length > 0 && (
				<SidebarGroup className="group-data-[collapsible=icon]:hidden">
					<SidebarGroupLabel>Favorite</SidebarGroupLabel>
					<SidebarMenu>{renderAppList(favoriteApps, true)}</SidebarMenu>
				</SidebarGroup>
			)}

			{/* Regular History Section */}
			<SidebarGroup className="group-data-[collapsible=icon]:hidden">
				<SidebarGroupLabel>History</SidebarGroupLabel>
				<SidebarMenu>{renderAppList(regularApps)}</SidebarMenu>
			</SidebarGroup>

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
		</>
	);
}
