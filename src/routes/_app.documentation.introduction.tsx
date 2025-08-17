import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Copy,
	Github,
	Zap,
	Code,
	Sparkles,
	Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/_app/documentation/introduction")({
	component: IntroductionPage,
});

function IntroductionPage() {
	return (
		<div className="space-y-8 p-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-base font-medium">Introduction</h1>
					<p className="text-muted-foreground text-sm mt-2">
						VibeCoder helps you build applications faster with intelligent code
						generation and real-time preview.
					</p>
				</div>
			</div>

			{/* Main Description */}
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					This tool combines the power of AI with modern web technologies to
					create a seamless coding experience. It provides real-time code
					generation, intelligent suggestions, and a sandboxed environment for
					rapid prototyping.
				</p>

				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>
						Provides an AI-first development environment with real-time code
						generation and sandboxed execution.
					</AlertDescription>
				</Alert>

				<p className="text-sm text-muted-foreground">
					Traditional development environments require extensive setup and
					manual coding. This eliminates these barriers by providing an AI-first
					approach to software development, making it accessible to developers
					of all skill levels.
				</p>
			</div>

			{/* Core Features */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Core features</h2>
						<p className="text-muted-foreground text-sm">
							Key capabilities that make VibeCoder powerful and efficient.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Zap className="h-5 w-5" />
									AI code generation
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Generate code instantly with natural language descriptions,
									reducing development time and increasing productivity.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Code className="h-5 w-5" />
									Real-time preview
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									See your changes in real-time with instant preview updates and
									hot reloading.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Sparkles className="h-5 w-5" />
									Sandbox environment
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Safe, isolated development environment for testing and
									experimentation without affecting your local setup.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Github className="h-5 w-5" />
									Project management
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Organize and manage your projects with version control and
									collaboration features.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<Separator />

			{/* Getting Started */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Getting started</h2>
						<p className="text-muted-foreground text-sm">
							Ready to start building with VibeCoder? Follow these simple steps
							to get up and running.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-base font-medium">
									Quick start
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground">
									Get up and running in minutes
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className="w-full">
									<Link to="/documentation/get-started">
										Get started
										<ArrowRight className="h-4 w-4 ml-2" />
									</Link>
								</Button>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-base font-medium">
									Changelog
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground">
									View recent updates and changes
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild variant="outline" className="w-full">
									<Link to="/documentation/changelog">
										Browse changelog
										<ArrowRight className="h-4 w-4 ml-2" />
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>
		</div>
	);
}
