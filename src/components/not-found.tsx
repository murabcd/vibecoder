import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
	return (
		<div className="flex min-h-full flex-col bg-background pt-16 pb-12">
			<div className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-6 lg:px-8 py-16 text-center">
				<p className="text-base font-semibold text-primary">404</p>
				<h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					Page not found.
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Sorry, we couldn&apos;t find the page you&apos;re looking for.
				</p>
				<div className="mt-6">
					<Button asChild>
						<Link to="/">Go back</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
