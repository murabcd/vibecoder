import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
	return (
		<div className="flex min-h-full flex-col bg-background pt-16 pb-12">
			<div className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-6 lg:px-8 py-16 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto">
					<div className="text-2xl font-semibold text-muted-foreground">
						404
					</div>
				</div>
				<h2 className="text-2xl font-semibold mt-6">Page not found</h2>
				<p className="text-muted-foreground text-sm mt-2 text-center max-w-sm mx-auto">
					Sorry, we couldn&apos;t find the page you&apos;re looking for.
				</p>
				<div className="mt-6">
					<Button asChild className="cursor-pointer">
						<Link to="/">Go back</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
