import { createFileRoute } from "@tanstack/react-router";

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/settings/billing")({
	component: RouteComponent,
});

// Mock data for usage events
const usageEvents = [
	{
		id: 1,
		eventType: "Voice",
		cost: "$0.09",
		date: "August 17, 2025",
		kind: "Monthly credits",
		model: "gpt-4o-mini-realtime-preview",
	},
	{
		id: 2,
		eventType: "Voice",
		cost: "$0.10",
		date: "August 12, 2025",
		kind: "Monthly credits",
		model: "gpt-4o-mini-realtime-preview",
	},
	{
		id: 3,
		eventType: "Voice",
		cost: "$0.08",
		date: "August 4, 2025",
		kind: "Monthly credits",
		model: "gpt-4o-realtime-preview",
	},
	{
		id: 4,
		eventType: "Voice",
		cost: "$0.05",
		date: "August 4, 2025",
		kind: "Monthly Credits",
		model: "gpt-4o-realtime-preview",
	},
	{
		id: 5,
		eventType: "Voice",
		cost: "$0.06",
		date: "August 1, 2025",
		kind: "Monthly credits",
		model: "gpt-4o-mini-realtime-preview",
	},
];

function RouteComponent() {
	return (
		<div className="space-y-8 p-8 max-w-4xl mx-auto">
			{/* Plan Summary Section */}
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-base font-medium">Plan summary</h2>
					<p className="text-muted-foreground text-sm">
						Manage your subscription and billing information.
					</p>
				</div>
				<Card className="shadow-sm">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg font-semibold">
									Current plan
								</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Your active subscription details
								</p>
							</div>
							<div className="flex items-center space-x-3">
								<Button variant="outline" size="sm" className="cursor-pointer">
									View all plans
								</Button>
								<Button size="sm" className="cursor-pointer">
									<CreditCard className="h-4 w-4 mr-2" />
									Upgrade
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="grid grid-cols-3 gap-8">
							<div className="text-center p-4 bg-muted/30 rounded-lg">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
									Current plan
								</p>
								<p className="text-xl font-semibold">Free plan</p>
							</div>
							<div className="text-center p-4 bg-muted/30 rounded-lg">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
									Price
								</p>
								<p className="text-xl font-semibold">Free</p>
							</div>
							<div className="text-center p-4 bg-muted/30 rounded-lg">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
									Monthly credits
								</p>
								<p className="text-xl font-semibold">$5.00</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Usage Events Section */}
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-base font-medium">Usage Events</h2>
					<p className="text-muted-foreground text-sm">
						Track your API usage and costs over time.
					</p>
				</div>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-base font-medium">Recent Usage</h3>
						<Select defaultValue="august-2025">
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="august-2025">August 2025</SelectItem>
								<SelectItem value="july-2025">July 2025</SelectItem>
								<SelectItem value="june-2025">June 2025</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Event type</TableHead>
								<TableHead>Cost</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Kind</TableHead>
								<TableHead>Model</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{usageEvents.map((event) => (
								<TableRow key={event.id}>
									<TableCell>
										<span>{event.eventType}</span>
									</TableCell>
									<TableCell>
										<div className="flex items-center space-x-2">
											<span>{event.cost}</span>
											<span className="text-xs text-muted-foreground cursor-help">
												ⓘ
											</span>
										</div>
									</TableCell>
									<TableCell>{event.date}</TableCell>
									<TableCell>{event.kind}</TableCell>
									<TableCell>{event.model}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{/* Pagination */}
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Select defaultValue="10">
								<SelectTrigger className="w-[110px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">Show 10</SelectItem>
									<SelectItem value="25">Show 25</SelectItem>
									<SelectItem value="50">Show 50</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center space-x-2">
							<span className="text-sm text-muted-foreground">1 of 1</span>
							<Button
								variant="outline"
								size="sm"
								disabled
								className="cursor-pointer"
							>
								←
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled
								className="cursor-pointer"
							>
								→
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
