import type * as React from "react";
import {
	AudioWaveform,
	BookOpen,
	Command,
	Frame,
	GalleryVerticalEnd,
	Map as MapIcon,
	PieChart,
	Plus,
	Settings2,
	SquareTerminal,
	Terminal,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const data = {
	user: {
		name: "Murad Abdulkadyrov",
		email: "murad@flomni.com",
		avatar: "/avatars/murad.png",
	},
	teams: [
		{
			name: "Acme Inc",
			logo: GalleryVerticalEnd,
			plan: "Enterprise",
		},
		{
			name: "Acme Corp.",
			logo: AudioWaveform,
			plan: "Startup",
		},
		{
			name: "Evil Corp.",
			logo: Command,
			plan: "Free",
		},
	],
	projects: [
		{
			name: "Vim todo",
			url: "#",
			icon: Frame,
		},
		{
			name: "PDF quiz generator",
			url: "#",
			icon: PieChart,
		},
		{
			name: "Modal with horizontal scroll",
			url: "#",
			icon: MapIcon,
		},
	],
};

interface AppHistoryItem {
	_id: string;
	title: string;
	description: string;
	code: string;
	files: Array<{ path: string; content: string }>;
	previewUrl?: string;
	sandboxId?: string;
	createdAt: number;
	starred?: boolean;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	onLoadApp?: (app: AppHistoryItem) => void;
}

export function AppSidebar({ onLoadApp, ...props }: AppSidebarProps) {
	const { setOpenMobile } = useSidebar();

	const navMain = [
		{
			title: "Projects",
			url: "/projects",
			icon: SquareTerminal,
			isActive: true,
			items: [
				{
					title: "All",
					url: "/projects/all",
				},
				{
					title: "Recents",
					url: "/projects/recent",
				},
			],
		},
		{
			title: "Documentation",
			url: "/documentation",
			icon: BookOpen,
			items: [
				{
					title: "Introduction",
					url: "/documentation/introduction",
				},
				{
					title: "Get started",
					url: "/documentation/get-started",
				},
				{
					title: "Changelog",
					url: "/documentation/changelog",
				},
			],
		},
		{
			title: "Settings",
			url: "/settings",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "/settings/general",
				},
				{
					title: "Billing",
					url: "/settings/billing",
				},
				{
					title: "API keys",
					url: "/settings/api-keys",
				},
			],
		},
	];

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<div className="flex flex-row justify-between items-center gap-1">
						<Link
							to="/"
							onClick={() => {
								setOpenMobile(false);
							}}
							className="flex flex-row gap-3 items-center text-lg font-semibold px-2 rounded-md cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-200 ease-linear"
						>
							<div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
								<Terminal className="h-4 w-4 text-background" />
							</div>
							<span className="group-data-[collapsible=icon]:hidden whitespace-nowrap">
								Vibe<span className="text-muted-foreground">Coder</span>
							</span>
						</Link>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 group-data-[collapsible=icon]:hidden cursor-pointer"
									onClick={() => {
										window.location.reload();
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>New vibe</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
				<NavProjects onLoadApp={onLoadApp} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
