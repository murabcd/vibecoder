import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Tag,
	Plus,
	Bug,
	Zap,
	AlertTriangle,
	CheckCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/documentation/changelog")({
	component: ChangelogPage,
});

const releases = [
	{
		version: "0.10.0",
		date: "2025-08-17",
		title: "Enhanced routing and settings",
		description:
			"Latest release with improved routing system and enhanced settings functionality.",
		type: "minor",
		changes: {
			features: [
				"Enhanced routing system with better navigation",
				"Improved settings page with additional configuration options",
				"App name generation functionality",
				"Project storage in database with Convex integration",
			],
			improvements: [
				"Better sidebar navigation experience",
				"Improved mobile code preview functionality",
				"Enhanced project management capabilities",
			],
			fixes: [
				"Fixed routing issues in settings pages",
				"Resolved project storage synchronization",
			],
		},
	},
	{
		version: "0.9.0",
		date: "2025-08-14",
		title: "Core features and sandbox integration",
		description:
			"Major feature release with Vercel sandbox integration and mobile support.",
		type: "minor",
		changes: {
			features: [
				"Vercel sandbox integration for code execution",
				"Mobile code preview with responsive design",
				"Sidebar navigation component",
				"Project database storage with Convex",
			],
			improvements: [
				"Migrated from Vinxi to Vite for better performance",
				"Enhanced code preview styling",
				"Improved follow-up messaging system",
			],
			fixes: [
				"Fixed hydration errors",
				"Resolved code view container issues",
				"Fixed lint errors across the codebase",
			],
		},
	},
	{
		version: "0.8.0",
		date: "2025-05-17",
		title: "Initial project setup and core functionality",
		description:
			"Initial release with basic project structure and core features.",
		type: "minor",
		changes: {
			features: [
				"Project initialization with TanStack Start",
				"Code generation with AI integration",
				"Status bar component",
				"Greeting message system",
				"Repository link integration",
			],
			improvements: [
				"Updated code generation prompts",
				"Enhanced README documentation",
				"Added favicon and project branding",
			],
			fixes: [
				"Fixed initial project setup issues",
				"Resolved greeting message display",
			],
		},
	},
];

function ChangelogPage() {
	const scrollToLatestRelease = () => {
		const latestReleaseElement = document.getElementById(
			`release-${releases[0].version}`,
		);
		if (latestReleaseElement) {
			latestReleaseElement.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="space-y-8 p-8 max-w-4xl mx-auto">
			{/* Header */}
			<div>
				<h1 className="text-base font-medium">Changelog</h1>
				<p className="text-muted-foreground text-sm mt-2">
					Track the latest updates, features, and improvements to VibeCoder.
				</p>
			</div>

			{/* Latest Release */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Latest release</h2>
						<p className="text-muted-foreground text-sm">
							The most recent stable release with new features and improvements.
						</p>
					</div>
					<Card className="border-2 border-primary/20">
						<CardHeader>
							<div className="flex items-center gap-2 mb-2">
								<Badge variant="default">latest</Badge>
								<Badge variant="secondary">v{releases[0].version}</Badge>
							</div>
							<CardTitle className="flex items-center gap-2 text-base font-medium">
								<Tag className="h-6 w-6" />
								{releases[0].title}
							</CardTitle>
							<CardDescription className="text-sm text-muted-foreground">
								{releases[0].description}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4 mb-4">
								<div className="text-sm text-muted-foreground">
									Released on {new Date(releases[0].date).toLocaleDateString()}
								</div>
							</div>
							<Button className="w-full" onClick={scrollToLatestRelease}>
								View release notes
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						</CardContent>
					</Card>
				</div>
			</section>

			<Separator />

			{/* All Releases */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">All releases</h2>
						<p className="text-muted-foreground text-sm">
							Complete history of all VibeCoder releases and their changes.
						</p>
					</div>
					<div className="space-y-6">
						{releases.map((release) => (
							<Card
								key={release.version}
								id={`release-${release.version}`}
								className="hover:shadow-md transition-shadow"
							>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge variant="secondary">v{release.version}</Badge>
											<Badge variant="outline">{release.type}</Badge>
										</div>
										<div className="text-sm text-muted-foreground">
											{new Date(release.date).toLocaleDateString()}
										</div>
									</div>
									<CardTitle className="text-base font-medium">
										{release.title}
									</CardTitle>
									<CardDescription className="text-sm text-muted-foreground">
										{release.description}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Tabs defaultValue="features" className="w-full">
										<TabsList className="grid w-full grid-cols-3">
											<TabsTrigger
												value="features"
												className="flex items-center gap-1"
											>
												<Plus className="h-4 w-4" />
												Features
											</TabsTrigger>
											<TabsTrigger
												value="improvements"
												className="flex items-center gap-1"
											>
												<Zap className="h-4 w-4" />
												Improvements
											</TabsTrigger>
											<TabsTrigger
												value="fixes"
												className="flex items-center gap-1"
											>
												<Bug className="h-4 w-4" />
												Fixes
											</TabsTrigger>
										</TabsList>

										<TabsContent value="features" className="space-y-2">
											{release.changes.features.length > 0 ? (
												release.changes.features.map((feature, index) => (
													<div
														key={`${release.version}-feature-${index}`}
														className="flex items-start gap-2"
													>
														<Plus className="h-4 w-4 mt-0.5" />
														<span className="text-sm">{feature}</span>
													</div>
												))
											) : (
												<div className="text-sm text-muted-foreground">
													No new features in this release.
												</div>
											)}
										</TabsContent>

										<TabsContent value="improvements" className="space-y-2">
											{release.changes.improvements.length > 0 ? (
												release.changes.improvements.map(
													(improvement, index) => (
														<div
															key={`${release.version}-improvement-${index}`}
															className="flex items-start gap-2"
														>
															<Zap className="h-4 w-4 mt-0.5" />
															<span className="text-sm">{improvement}</span>
														</div>
													),
												)
											) : (
												<div className="text-sm text-muted-foreground">
													No improvements in this release.
												</div>
											)}
										</TabsContent>

										<TabsContent value="fixes" className="space-y-2">
											{release.changes.fixes.length > 0 ? (
												release.changes.fixes.map((fix, index) => (
													<div
														key={`${release.version}-fix-${index}`}
														className="flex items-start gap-2"
													>
														<Bug className="h-4 w-4 mt-0.5" />
														<span className="text-sm">{fix}</span>
													</div>
												))
											) : (
												<div className="text-sm text-muted-foreground">
													No bug fixes in this release.
												</div>
											)}
										</TabsContent>
									</Tabs>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			<Separator />

			{/* Feedback */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Feedback & support</h2>
						<p className="text-muted-foreground text-sm">
							Help us improve VibeCoder by sharing your feedback.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-base font-medium">
									Report issues
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground">
									Found a bug? Let us know about it
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="outline" className="w-full">
									Create issue
									<ArrowRight className="h-4 w-4 ml-2" />
								</Button>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-base font-medium">
									Feature requests
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground">
									Have an idea for a new feature?
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="outline" className="w-full">
									Submit request
									<ArrowRight className="h-4 w-4 ml-2" />
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>
		</div>
	);
}
