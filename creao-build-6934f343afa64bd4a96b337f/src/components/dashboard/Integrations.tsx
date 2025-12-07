import { useState } from "react";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";

interface IntegrationsProps {
	userProfile: UserProfileModel;
}

interface Integration {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: string;
	status: "connected" | "disconnected";
	features: string[];
	color: string;
}

export function Integrations({ userProfile }: IntegrationsProps) {
	const [integrations, setIntegrations] = useState<Integration[]>([
		{
			id: "stripe",
			name: "Stripe",
			description: "Automatically sync your Stripe transactions, subscriptions, and revenue data",
			icon: "https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg?q=80&w=256",
			category: "Payments",
			status: "disconnected",
			features: [
				"Auto-sync transactions",
				"Track subscriptions",
				"Monitor revenue",
				"Manage refunds"
			],
			color: "bg-purple-50 border-purple-200"
		}
	]);

	const handleConnect = async (integrationId: string) => {
		const integration = integrations.find(i => i.id === integrationId);
		if (!integration) return;

		if (integration.status === "connected") {
			// Disconnect
			setIntegrations(prev =>
				prev.map(i =>
					i.id === integrationId
						? { ...i, status: "disconnected" as const }
						: i
				)
			);
			toast.success(`${integration.name} disconnected successfully`);
		} else {
			// Connect - In a real app, this would open OAuth flow or API key input
			toast.info(`Opening ${integration.name} connection...`);

			// Simulate connection after a delay
			setTimeout(() => {
				setIntegrations(prev =>
					prev.map(i =>
						i.id === integrationId
							? { ...i, status: "connected" as const }
							: i
					)
				);
				toast.success(`${integration.name} connected successfully!`);
			}, 1500);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Integrations</h2>
				<p className="text-zinc-600 mt-2">
					Connect your financial accounts and services to automatically track transactions
				</p>
			</div>

			<Alert className="bg-blue-50 border-blue-200">
				<Info className="h-4 w-4 text-blue-600" />
				<AlertDescription className="text-blue-900">
					Integrations allow SavFlo to automatically import your transactions, subscriptions, and financial data.
					All connections are secure and encrypted.
				</AlertDescription>
			</Alert>

			{/* Integrations Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{integrations.map((integration) => (
					<Card key={integration.id} className={integration.color}>
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center p-2">
										<img
											src={integration.icon}
											alt={`${integration.name} logo`}
											className="w-full h-full object-contain"
										/>
									</div>
									<div>
										<CardTitle className="text-lg">{integration.name}</CardTitle>
										<Badge variant="outline" className="mt-1 text-xs">
											{integration.category}
										</Badge>
									</div>
								</div>
								<div className="flex items-center gap-1">
									{integration.status === "connected" ? (
										<CheckCircle2 className="w-5 h-5 text-green-600" />
									) : (
										<XCircle className="w-5 h-5 text-zinc-400" />
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<CardDescription className="text-sm">
								{integration.description}
							</CardDescription>

							<div className="space-y-2">
								<p className="text-xs font-medium text-zinc-700">Features:</p>
								<ul className="space-y-1">
									{integration.features.map((feature, index) => (
										<li key={index} className="text-xs text-zinc-600 flex items-center gap-2">
											<div className="w-1 h-1 rounded-full bg-zinc-400" />
											{feature}
										</li>
									))}
								</ul>
							</div>

							<div className="flex items-center gap-2 pt-2">
								<Button
									onClick={() => handleConnect(integration.id)}
									className={
										integration.status === "connected"
											? "flex-1 bg-zinc-900 hover:bg-zinc-800"
											: "flex-1 bg-zinc-900 hover:bg-zinc-800"
									}
									variant={integration.status === "connected" ? "outline" : "default"}
								>
									{integration.status === "connected" ? "Disconnect" : "Connect"}
								</Button>
								{integration.status === "connected" && (
									<Button
										variant="outline"
										size="icon"
										onClick={() => toast.info("Opening integration settings...")}
									>
										<ExternalLink className="w-4 h-4" />
									</Button>
								)}
							</div>

							{integration.status === "connected" && (
								<div className="pt-2">
									<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
										<CheckCircle2 className="w-3 h-3 mr-1" />
										Active
									</Badge>
								</div>
							)}
						</CardContent>
					</Card>
				))}

				{/* Coming Soon Cards */}
				<Card className="bg-zinc-50 border-zinc-200 opacity-75">
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
								<span className="text-2xl">🏦</span>
							</div>
							<div>
								<CardTitle className="text-lg">Bank Accounts</CardTitle>
								<Badge variant="secondary" className="mt-1 text-xs">
									Coming Soon
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<CardDescription className="text-sm">
							Connect directly to your bank for automatic transaction imports via Plaid or similar services.
						</CardDescription>
					</CardContent>
				</Card>

				<Card className="bg-zinc-50 border-zinc-200 opacity-75">
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
								<span className="text-2xl">💳</span>
							</div>
							<div>
								<CardTitle className="text-lg">Credit Cards</CardTitle>
								<Badge variant="secondary" className="mt-1 text-xs">
									Coming Soon
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<CardDescription className="text-sm">
							Sync credit card transactions and track spending across all your cards in one place.
						</CardDescription>
					</CardContent>
				</Card>

				<Card className="bg-zinc-50 border-zinc-200 opacity-75">
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
								<span className="text-2xl">📊</span>
							</div>
							<div>
								<CardTitle className="text-lg">PayPal</CardTitle>
								<Badge variant="secondary" className="mt-1 text-xs">
									Coming Soon
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<CardDescription className="text-sm">
							Import PayPal transactions and track online payments automatically.
						</CardDescription>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
