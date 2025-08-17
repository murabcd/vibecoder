import { useState, useEffect, createContext, useContext, useRef } from "react";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

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

interface AppHistoryItem {
	_id: string;
	title: string;
	description: string;
	code: string;
	files: Array<{ path: string; content: string }>;
	previewUrl?: string;
	sandboxId?: string;
}

const AppLoadContext = createContext<{
	onLoadApp?: (app: AppHistoryItem) => void;
	registerLoadAppHandler?: (handler: (app: AppHistoryItem) => void) => void;
}>({});

export const useAppLoad = () => useContext(AppLoadContext);

function AppBreadcrumbs() {
	const location = useLocation();

	const pathSegments = location.pathname.split("/").filter(Boolean);

	if (pathSegments.length === 0) return null;

	const getDisplayName = (segment: string) => {
		switch (segment) {
			case "projects":
				return "Projects";
			case "settings":
				return "Settings";
			case "documentation":
				return "Documentation";
			case "all":
				return "All";
			case "recent":
				return "Recents";
			case "introduction":
				return "Introduction";
			case "get-started":
				return "Get started";
			case "tutorials":
				return "Tutorials";
			case "changelog":
				return "Changelog";
			case "general":
				return "General";
			case "billing":
				return "Billing";
			case "api-keys":
				return "API keys";
			default:
				return segment.charAt(0).toUpperCase() + segment.slice(1);
		}
	};

	// For main sections, treat them as the root (no "Home" prefix)
	const isMainSection = ["projects", "documentation", "settings"].includes(
		pathSegments[0],
	);

	if (isMainSection) {
		const breadcrumbItems = pathSegments.map((segment, index) => {
			const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
			const isLast = index === pathSegments.length - 1;

			return { path, segment, isLast, displayName: getDisplayName(segment) };
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
	const loadAppHandlerRef = useRef<((app: AppHistoryItem) => void) | null>(
		null,
	);

	const registerLoadAppHandler = (handler: (app: AppHistoryItem) => void) => {
		loadAppHandlerRef.current = handler;
	};

	const handleLoadApp = (app: AppHistoryItem) => {
		if (loadAppHandlerRef.current) {
			loadAppHandlerRef.current(app);
		}
	};

	if (!isInitialized) {
		return null;
	}

	return (
		<AppLoadContext.Provider
			value={{ onLoadApp: handleLoadApp, registerLoadAppHandler }}
		>
			<SidebarProvider defaultOpen={defaultOpen}>
				<AppSidebar onLoadApp={handleLoadApp} />
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
		</AppLoadContext.Provider>
	);
}
