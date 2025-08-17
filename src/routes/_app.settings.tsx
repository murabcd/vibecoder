import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/_app/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col h-full">
			{/* Settings Navigation */}
			<div className="border-b">
				<div className="px-6 flex h-12 items-center space-x-8">
					<nav className="flex items-center space-x-6 text-sm font-medium h-full">
						<Link
							to="/settings/general"
							className={cn(
								"transition-colors hover:text-foreground/80 h-full flex items-center relative",
								"text-foreground/60",
							)}
							activeProps={{
								className: "text-foreground [&>div]:opacity-100",
							}}
						>
							General
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 transition-opacity" />
						</Link>
						<Link
							to="/settings/billing"
							className={cn(
								"transition-colors hover:text-foreground/80 h-full flex items-center relative",
								"text-foreground/60",
							)}
							activeProps={{
								className: "text-foreground [&>div]:opacity-100",
							}}
						>
							Billing
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 transition-opacity" />
						</Link>
						<Link
							to="/settings/api-keys"
							className={cn(
								"transition-colors hover:text-foreground/80 h-full flex items-center relative",
								"text-foreground/60",
							)}
							activeProps={{
								className: "text-foreground [&>div]:opacity-100",
							}}
						>
							API keys
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 transition-opacity" />
						</Link>
					</nav>
				</div>
			</div>

			{/* Settings Content */}
			<div className="flex-1 overflow-auto">
				<Outlet />
			</div>
		</div>
	);
}
