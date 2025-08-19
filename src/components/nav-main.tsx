import { ChevronRight, type LucideIcon } from "lucide-react";
import { useLocation } from "@tanstack/react-router";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: LucideIcon;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
			icon?: LucideIcon;
			count?: number;
		}[];
	}[];
}) {
	const { state } = useSidebar();
	const location = useLocation();
	const isCollapsed = state === "collapsed";

	const isMainItemActive = (item: (typeof items)[0]) => {
		return (
			location.pathname.startsWith(item.url) ||
			item.items?.some((subItem) => location.pathname === subItem.url)
		);
	};

	const isSubItemActive = (subItem: { url: string }) => {
		return location.pathname === subItem.url;
	};

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Playground</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						asChild
						defaultOpen={isMainItemActive(item)}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							{isCollapsed ? (
								<SidebarMenuButton tooltip={item.title} asChild>
									<a href={item.url}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</a>
								</SidebarMenuButton>
							) : (
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
										<ChevronRight className="absolute right-2 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
							)}
							{!isCollapsed && (
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													asChild
													isActive={isSubItemActive(subItem)}
												>
													<a
														href={subItem.url}
														className="flex items-center justify-between w-full"
													>
														<div className="flex items-center gap-2">
															{subItem.icon && (
																<subItem.icon className="h-4 w-4" />
															)}
															<span>{subItem.title}</span>
														</div>
														{subItem.count !== undefined && (
															<span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
																{subItem.count}
															</span>
														)}
													</a>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							)}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
