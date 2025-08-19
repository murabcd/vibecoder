import { createFileRoute } from "@tanstack/react-router";
import {
	Copy,
	CheckCircle,
	Terminal,
	Package,
	Settings,
	AlertTriangle,
	Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/_app/documentation/get-started")({
	component: GetStartedPage,
});

// CopyButton component for reusable copy functionality
function CopyButton({ text }: { text: string }) {
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy text: ", err);
			toast.error("Failed to copy to clipboard");
		}
	};

	return (
		<Button
			variant="ghost"
			size="sm"
			className="ml-2 cursor-pointer"
			onClick={handleCopy}
			title="Copy to clipboard"
		>
			<Copy className="h-4 w-4" />
		</Button>
	);
}

function GetStartedPage() {
	return (
		<div className="space-y-8 p-8 max-w-4xl mx-auto">
			<div>
				<h1 className="text-base font-medium">Get started</h1>
				<p className="text-muted-foreground text-sm mt-2">
					Learn how to set up and run VibeCoder for your development workflow.
				</p>
			</div>

			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Prerequisites</h2>
						<p className="text-muted-foreground text-sm">
							Make sure you have the required tools and dependencies installed.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Terminal className="h-5 w-5" />
									Bun
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-2">
									JavaScript runtime and package manager
								</p>
								<Badge variant="secondary">Required</Badge>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Package className="h-5 w-5" />
									Vercel CLI
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-2">
									For environment variables and deployment
								</p>
								<Badge variant="secondary">Required</Badge>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-medium">
									<Settings className="h-5 w-5" />
									OpenAI API Key
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-2">
									For AI-powered code generation
								</p>
								<Badge variant="secondary">Required</Badge>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<Separator />

			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Installation</h2>
						<p className="text-muted-foreground text-sm">
							Follow these steps to set up VibeCoder on your system.
						</p>
					</div>
					<div className="space-y-4">
						<div>
							<h3 className="text-sm font-medium mb-2">
								1. Clone the repository
							</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									git clone https://github.com/murabcd/vibecoder.git
								</code>
								<CopyButton text="git clone https://github.com/murabcd/vibecoder.git" />
							</div>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">
								2. Navigate to the project
							</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									cd vibecoder
								</code>
								<CopyButton text="cd vibecoder" />
							</div>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">
								3. Install Vercel CLI
							</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									bun i -g vercel
								</code>
								<CopyButton text="bun i -g vercel" />
							</div>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">4. Link with Vercel</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									vercel link
								</code>
								<CopyButton text="vercel link" />
							</div>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">
								5. Download environment variables
							</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									vercel env pull
								</code>
								<CopyButton text="vercel env pull" />
							</div>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">
								6. Install dependencies
							</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									bun install
								</code>
								<CopyButton text="bun install" />
							</div>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">
								7. Start the development server
							</h3>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									bun dev
								</code>
								<CopyButton text="bun dev" />
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator />

			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Configuration</h2>
						<p className="text-muted-foreground text-sm">
							Set up your environment variables and API keys.
						</p>
					</div>
					<div className="space-y-6">
						<div>
							<h3 className="text-sm font-medium mb-2">
								Environment variables
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								The required environment variables will be downloaded when you
								run{" "}
								<code className="bg-muted px-1 rounded">vercel env pull</code>.
								Make sure you have the following variables configured:
							</p>
							<div className="bg-muted p-4 rounded-lg flex items-center gap-3">
								<code className="text-sm font-mono flex-1 break-all">
									# OpenAI API Key (Required)
									<br />
									VITE_OPENAI_API_KEY=your_openai_api_key_here
									<br />
									<br /># Convex URL (for backend)
									<br />
									VITE_CONVEX_URL=your_convex_url_here
								</code>
								<CopyButton
									text={`# OpenAI API Key (Required)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Convex URL (for backend)
VITE_CONVEX_URL=your_convex_url_here`}
								/>
							</div>
							<Alert variant="destructive" className="mt-4">
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									Do not commit your `.env` file or it will expose secrets that
									will allow others to control access.
								</AlertDescription>
							</Alert>
						</div>
					</div>
				</div>
			</section>

			<Separator />

			{/* Next Steps */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Next steps</h2>
						<p className="text-muted-foreground text-sm">
							If you found this project helpful, consider starring it on GitHub
							to show your support.
						</p>
					</div>
					<Button asChild variant="outline" className="w-fit">
						<a
							href="https://github.com/murabcd/vibecoder"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Star className="h-4 w-4 mr-2" />
							View on GitHub
						</a>
					</Button>
				</div>
			</section>

			<Separator />

			{/* Troubleshooting */}
			<section>
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Troubleshooting</h2>
						<p className="text-muted-foreground text-sm">
							Common issues and their solutions.
						</p>
					</div>
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<CheckCircle className="h-5 w-5 mt-0.5" />
							<div>
								<h3 className="text-sm font-medium">Port already in use</h3>
								<p className="text-sm text-muted-foreground">
									If port 3000 is already in use, the development server will
									automatically use the next available port.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<CheckCircle className="h-5 w-5 mt-0.5" />
							<div>
								<h3 className="text-sm font-medium">
									OpenAI API key not working
								</h3>
								<p className="text-sm text-muted-foreground">
									Make sure your API key is correctly set in the environment
									variables and has sufficient credits.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<CheckCircle className="h-5 w-5 mt-0.5" />
							<div>
								<h3 className="text-sm font-medium">
									Vercel environment variables
								</h3>
								<p className="text-sm text-muted-foreground">
									If you haven't set up Vercel environment variables, you can
									create a `.env.local` file manually.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<CheckCircle className="h-5 w-5 mt-0.5" />
							<div>
								<h3 className="text-sm font-medium">Build errors</h3>
								<p className="text-sm text-muted-foreground">
									Clear your node_modules and reinstall dependencies if you
									encounter build issues.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
