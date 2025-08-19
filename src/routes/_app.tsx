import { useState, useEffect } from "react";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ModeToggle from "@/components/mode-toggle";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function useSidebarState() {
	const [defaultOpen, setDefaultOpen] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		const cookies = document.cookie.split(";");
		const sidebarCookie = cookies.find((cookie) =>
			cookie.trim().startsWith("sidebar_state="),
		);

		if (sidebarCookie) {
			const value = sidebarCookie.split("=")[1];
			setDefaultOpen(value === "true");
		}

		setIsInitialized(true);
	}, []);

	return { defaultOpen, isInitialized };
}

function AppBreadcrumbs() {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const fromParam = searchParams.get("from") || "all";

	const pathSegments = location.pathname.split("/").filter(Boolean);

	// Check if this is a direct project route (/projects/projectId)
	const isDirectProjectRoute =
		pathSegments.length === 2 &&
		pathSegments[0] === "projects" &&
		pathSegments[1] !== "all" &&
		pathSegments[1] !== "recent";
	const projectId = isDirectProjectRoute ? pathSegments[1] : null;

	// Fetch project data if this is a direct project route
	const project = useQuery(
		api.projects.get,
		projectId ? { id: projectId as Id<"projects"> } : "skip",
	);

	if (pathSegments.length === 0) return null;

	const DISPLAY_NAMES: Record<string, string> = {
		projects: "Projects",
		settings: "Settings",
		documentation: "Documentation",
		all: "All",
		recent: "Recents",
		introduction: "Introduction",
		"get-started": "Get started",
		changelog: "Changelog",
		general: "General",
		billing: "Billing",
		"api-keys": "API keys",
	};

	const getDisplayName = (segment: string, isProjectId = false) => {
		if (isProjectId && project) {
			return project.title || "Untitled Project";
		}
		return (
			DISPLAY_NAMES[segment] ||
			segment.charAt(0).toUpperCase() + segment.slice(1)
		);
	};

	const DEFAULT_SUB_PATHS: Record<string, string> = {
		projects: "/projects/all",
		documentation: "/documentation/introduction",
		settings: "/settings/general",
	};

	const getDefaultSubPath = (segment: string) => {
		return DEFAULT_SUB_PATHS[segment] || `/${segment}`;
	};

	// For main sections, treat them as the root (no "Home" prefix)
	const isMainSection = ["projects", "documentation", "settings"].includes(
		pathSegments[0],
	);

	if (isMainSection) {
		// Special handling for direct project routes
		if (isDirectProjectRoute && project) {
			const fromPath =
				fromParam === "recent" ? "/projects/recent" : "/projects/all";
			const fromDisplayName = fromParam === "recent" ? "Recent" : "All";

			const breadcrumbItems = [
				{
					path: "/projects/all",
					segment: "projects",
					isLast: false,
					displayName: "Projects",
				},
				{
					path: fromPath,
					segment: fromParam,
					isLast: false,
					displayName: fromDisplayName,
				},
				{
					path: location.pathname,
					segment: projectId,
					isLast: true,
					displayName: getDisplayName(projectId || "", true),
				},
			];

			return (
				<Breadcrumb>
					<BreadcrumbList>
						{breadcrumbItems.map((item, index) => (
							<div
								key={`${item.path}-${item.segment}-${index}`}
								className="flex items-center gap-1.5"
							>
								{index > 0 && <BreadcrumbSeparator />}
								<BreadcrumbItem>
									{item.isLast ? (
										<BreadcrumbPage>{item.displayName}</BreadcrumbPage>
									) : (
										<BreadcrumbLink href={item.path}>
											{item.displayName}
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
							</div>
						))}
					</BreadcrumbList>
				</Breadcrumb>
			);
		}

		const breadcrumbItems = pathSegments.map((segment, index) => {
			const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
			const isLast = index === pathSegments.length - 1;
			const isParentSection =
				index === 0 &&
				["projects", "documentation", "settings"].includes(segment);
			const actualPath =
				isParentSection && !isLast ? getDefaultSubPath(segment) : path;

			return {
				path: actualPath,
				segment,
				isLast,
				displayName: getDisplayName(segment),
			};
		});

		return (
			<Breadcrumb>
				<BreadcrumbList>
					{breadcrumbItems.map((item, index) => (
						<div key={item.path} className="flex items-center gap-1.5">
							{index > 0 && <BreadcrumbSeparator />}
							<BreadcrumbItem>
								{item.isLast ? (
									<BreadcrumbPage>{item.displayName}</BreadcrumbPage>
								) : (
									<BreadcrumbLink href={item.path}>
										{item.displayName}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</div>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	// Default behavior for other sections
	const breadcrumbItems = pathSegments.map((segment, index) => {
		const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
		const isLast = index === pathSegments.length - 1;

		return { path, segment, isLast, displayName: getDisplayName(segment) };
	});

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="/">Home</BreadcrumbLink>
				</BreadcrumbItem>
				{breadcrumbItems.map((item) => (
					<div key={item.path} className="flex items-center gap-1.5">
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{item.isLast ? (
								<BreadcrumbPage>{item.displayName}</BreadcrumbPage>
							) : (
								<BreadcrumbLink href={item.path}>
									{item.displayName}
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	const { defaultOpen, isInitialized } = useSidebarState();

	if (!isInitialized) {
		return null;
	}

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<AppBreadcrumbs />
					</div>
					<div className="flex-1"></div>
					<div className="flex items-center gap-2 px-4">
						<ModeToggle />
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
