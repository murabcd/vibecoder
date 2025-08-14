"use client";

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

// This is sample data.
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
	navMain: [
		{
			title: "Projects",
			url: "#",
			icon: SquareTerminal,
			isActive: true,
			items: [
				{
					title: "Recents",
					url: "#",
				},
				{
					title: "Starred",
					url: "#",
				},
			],
		},
		{
			title: "Documentation",
			url: "#",
			icon: BookOpen,
			items: [
				{
					title: "Introduction",
					url: "#",
				},
				{
					title: "Get started",
					url: "#",
				},
				{
					title: "Tutorials",
					url: "#",
				},
				{
					title: "Changelog",
					url: "#",
				},
			],
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "#",
				},
				{
					title: "Team",
					url: "#",
				},
				{
					title: "Billing",
					url: "#",
				},
				{
					title: "Limits",
					url: "#",
				},
			],
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { setOpenMobile } = useSidebar();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<div className="flex flex-row justify-between items-center gap-1">
						<button
							type="button"
							onClick={() => {
								setOpenMobile(false);
							}}
							className="flex flex-row gap-3 items-center text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-200 ease-linear"
						>
							<div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
								<Terminal className="h-4 w-4 text-background" />
							</div>
							<span className="group-data-[collapsible=icon]:hidden whitespace-nowrap">
								Vibe <span className="text-muted-foreground">Coder</span>
							</span>
						</button>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 group-data-[collapsible=icon]:hidden"
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
				<NavMain items={data.navMain} />
				<NavProjects projects={data.projects} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
