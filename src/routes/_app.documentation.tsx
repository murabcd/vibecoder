import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/documentation")({
	component: DocumentationLayout,
});

function DocumentationLayout() {
	return (
		<div className="flex flex-col h-full">
			{/* Documentation Navigation */}
			<div className="border-b">
				<div className="px-6 flex h-12 items-center space-x-8">
					<nav className="flex items-center space-x-6 text-sm font-medium h-full">
						<Link
							to="/documentation/introduction"
							className={cn(
								"transition-colors hover:text-foreground/80 h-full flex items-center relative",
								"text-foreground/60",
							)}
							activeProps={{
								className: "text-foreground [&>div]:opacity-100",
							}}
						>
							Introduction
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 transition-opacity" />
						</Link>
						<Link
							to="/documentation/get-started"
							className={cn(
								"transition-colors hover:text-foreground/80 h-full flex items-center relative",
								"text-foreground/60",
							)}
							activeProps={{
								className: "text-foreground [&>div]:opacity-100",
							}}
						>
							Get started
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 transition-opacity" />
						</Link>
						<Link
							to="/documentation/changelog"
							className={cn(
								"transition-colors hover:text-foreground/80 h-full flex items-center relative",
								"text-foreground/60",
							)}
							activeProps={{
								className: "text-foreground [&>div]:opacity-100",
							}}
						>
							Changelog
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 transition-opacity" />
						</Link>
					</nav>
				</div>
			</div>

			{/* Documentation Content */}
			<div className="flex-1 overflow-auto">
				<div className="mx-auto max-w-4xl px-6 py-8">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
