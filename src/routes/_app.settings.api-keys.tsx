import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Eye, EyeOff, Trash2, Key, Calendar } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export const Route = createFileRoute("/_app/settings/api-keys")({
	component: RouteComponent,
});

// Type definition for API keys
interface ApiKey {
	id: number;
	name: string;
	key: string;
	created: string;
	lastUsed: string;
	status: "active" | "inactive";
	permissions: string[];
}

function RouteComponent() {
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
	const [showKey, setShowKey] = useState<number | null>(null);
	const [newKeyName, setNewKeyName] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const toggleKeyVisibility = (id: number) => {
		setShowKey(showKey === id ? null : id);
	};

	const deleteApiKey = (id: number) => {
		setApiKeys(apiKeys.filter((key) => key.id !== id));
	};

	const createApiKey = () => {
		if (!newKeyName.trim()) return;

		const newKey: ApiKey = {
			id: Date.now(),
			name: newKeyName,
			key: `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
			created: new Date().toISOString().split("T")[0],
			lastUsed: "Never",
			status: "active",
			permissions: ["read", "write"],
		};

		setApiKeys([newKey, ...apiKeys]);
		setNewKeyName("");
		setIsCreateDialogOpen(false);
	};

	const getStatusBadge = (status: string) => {
		if (status === "active") {
			return (
				<Badge variant="default" className="bg-green-100 text-green-800">
					Active
				</Badge>
			);
		}
		return <Badge variant="secondary">Inactive</Badge>;
	};

	const getPermissionBadges = (permissions: string[]) => {
		return permissions.map((permission) => (
			<Badge key={permission} variant="outline" className="text-xs">
				{permission}
			</Badge>
		));
	};

	return (
		<div className="space-y-8 p-8 max-w-4xl mx-auto">
			<div className="space-y-6">
				<div className="space-y-2">
					<div className="flex items-start justify-between">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<h2 className="text-base font-medium">API Keys</h2>
								<Badge variant="secondary" className="text-xs">
									Beta
								</Badge>
							</div>
							<p className="text-muted-foreground text-sm">
								Manage your API keys. While in Beta, API calls consume your
								credits.
							</p>
						</div>
						<Dialog
							open={isCreateDialogOpen}
							onOpenChange={setIsCreateDialogOpen}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									New key
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>New API key</DialogTitle>
									<DialogDescription>
										Create a new API key to access the platform. Keep your keys
										secure and never share them publicly.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="key-name">Key Name</Label>
										<Input
											id="key-name"
											placeholder="Enter a name for your API key"
											value={newKeyName}
											onChange={(e) => setNewKeyName(e.target.value)}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setIsCreateDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button onClick={createApiKey} disabled={!newKeyName.trim()}>
										Create Key
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</div>

			<div className="space-y-6">
				{apiKeys.length === 0 ? (
					<div className="border-1 border-dashed border-border rounded-lg p-12 flex items-center justify-center">
						<div className="text-center">
							<h3 className="text-sm text-muted-foreground">
								No API keys added
							</h3>
						</div>
					</div>
				) : (
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-medium">API keys</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>API Key</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Last Used</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Permissions</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{apiKeys.map((apiKey) => (
										<TableRow key={apiKey.id}>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Key className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">{apiKey.name}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<code className="text-sm bg-muted px-2 py-1 rounded">
														{showKey === apiKey.id
															? apiKey.key
															: `${apiKey.key.substring(0, 12)}...${apiKey.key.substring(apiKey.key.length - 4)}`}
													</code>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => toggleKeyVisibility(apiKey.id)}
													>
														{showKey === apiKey.id ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => copyToClipboard(apiKey.key)}
													>
														<Copy className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Calendar className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">{apiKey.created}</span>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm text-muted-foreground">
													{apiKey.lastUsed}
												</span>
											</TableCell>
											<TableCell>{getStatusBadge(apiKey.status)}</TableCell>
											<TableCell>
												<div className="flex space-x-1">
													{getPermissionBadges(apiKey.permissions)}
												</div>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => deleteApiKey(apiKey.id)}
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
