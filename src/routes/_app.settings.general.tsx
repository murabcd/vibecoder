import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/settings/general")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-8 p-8 max-w-4xl mx-auto">
			{/* Personal Information Section */}
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-base font-medium">Personal information</h2>
					<p className="text-muted-foreground text-sm">
						Manage your personal information and role.
					</p>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First name</Label>
							<Input id="firstName" defaultValue="Murad" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last name</Label>
							<Input id="lastName" defaultValue="Abdulkadyrov" />
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" defaultValue="emma@acme.com" />
					</div>

					<div className="flex justify-end">
						<Button>Save</Button>
					</div>
				</div>
			</div>

			<Separator />

			{/* Notification Settings Section */}
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-base font-medium">Notification settings</h2>
					<p className="text-muted-foreground text-sm">
						Configure the types of notifications you want to receive.
					</p>
				</div>

				<div className="space-y-6">
					{/* Usage Notifications */}
					<div className="space-y-4">
						<div className="space-y-3">
							<div className="flex items-center space-x-2">
								<Checkbox id="errorAlerts" defaultChecked />
								<Label htmlFor="errorAlerts" className="text-sm font-normal">
									Security alerts
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox id="usageUpdates" />
								<Label htmlFor="usageUpdates" className="text-sm font-normal">
									Usage and quota updates
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox id="featureUpdates" />
								<Label htmlFor="featureUpdates" className="text-sm font-normal">
									New feature announcements
								</Label>
							</div>
						</div>
					</div>

					<div className="flex justify-end">
						<Button>Save</Button>
					</div>
				</div>
			</div>

			<Separator />

			{/* Preferences Section */}
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-base font-medium">Preferences</h2>
					<p className="text-muted-foreground text-sm">
						Configure your experience and behavior settings.
					</p>
				</div>

				<div className="space-y-6">
					<div className="space-y-3">
						<div className="flex items-center space-x-2">
							<Checkbox id="suggestions" defaultChecked />
							<Label htmlFor="suggestions" className="text-sm font-normal">
								Enable coding suggestions
							</Label>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox id="soundNotifications" defaultChecked />
							<Label
								htmlFor="soundNotifications"
								className="text-sm font-normal"
							>
								Play sound when responses are ready
							</Label>
						</div>
					</div>

					<div className="space-y-4">
						<div className="space-y-1">
							<h3 className="text-sm font-medium leading-none">
								Custom Instructions
							</h3>
							<p className="text-sm text-muted-foreground">
								What would you like to share about yourself to get better
								responses?
							</p>
						</div>
						<Textarea
							placeholder="Write your custom instructions here..."
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex justify-end">
						<Button>Save</Button>
					</div>
				</div>
			</div>

			<Separator />

			<div className="space-y-6">
				<div className="space-y-4">
					<div className="space-y-2">
						<h2 className="text-base font-medium">Danger zone</h2>
						<p className="text-muted-foreground text-sm">
							Permanently delete your account and all associated data. This
							action cannot be undone.
						</p>
					</div>
					<div className="flex justify-start">
						<Button
							variant="outline"
							className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
						>
							Delete account
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
