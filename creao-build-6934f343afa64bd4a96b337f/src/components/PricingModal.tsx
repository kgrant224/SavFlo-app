import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type PricingTier = "free" | "lite" | "premium" | "yearly";

interface PricingModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentTier?: PricingTier;
	onUpgrade?: (tier: PricingTier) => Promise<void>;
	highlightFeature?: string;
}

export function PricingModal({
	open,
	onOpenChange,
	currentTier = "free",
	onUpgrade,
	highlightFeature
}: PricingModalProps) {
	const [selectedTier, setSelectedTier] = useState<PricingTier>("premium");
	const [isLoading, setIsLoading] = useState(false);

	const handleUpgrade = async () => {
		if (!onUpgrade) {
			toast.info("Payment integration coming soon! For now, enjoy premium features.");
			onOpenChange(false);
			return;
		}

		setIsLoading(true);
		try {
			await onUpgrade(selectedTier);
			toast.success(`Successfully upgraded to ${selectedTier === "yearly" ? "Premium (Yearly)" : "Premium"}!`);
			onOpenChange(false);
		} catch (error) {
			console.error("Upgrade error:", error);
			toast.error("Upgrade failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-3xl font-bold text-center">
						Choose Your Financial Journey
					</DialogTitle>
					<DialogDescription className="text-center text-base">
						Unlock personalized AI coaching and advanced insights to transform your financial habits
					</DialogDescription>
				</DialogHeader>

				{highlightFeature && (
					<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
						<strong>Unlock this feature:</strong> {highlightFeature}
					</div>
				)}

				<div className="grid md:grid-cols-3 gap-4 mt-6">
					{/* Free Tier */}
					<Card className={cn(
						"relative p-6 transition-all",
						currentTier === "free" && "border-zinc-900"
					)}>
						{currentTier === "free" && (
							<Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-zinc-900">
								Current Plan
							</Badge>
						)}
						<div className="text-center mb-4">
							<h3 className="text-xl font-bold">Free</h3>
							<div className="mt-2">
								<span className="text-4xl font-bold">$0</span>
								<span className="text-zinc-600">/mo</span>
							</div>
							<p className="text-sm text-zinc-600 mt-2">Get started with basics</p>
						</div>

						<ul className="space-y-3 mb-6">
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Track spending manually</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Basic category summaries</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Daily spending log</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>1 basic weekly report</span>
							</li>
							<li className="flex items-start gap-2 text-sm text-zinc-400">
								<X className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>AI budget planning</span>
							</li>
							<li className="flex items-start gap-2 text-sm text-zinc-400">
								<X className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>Deep analysis & insights</span>
							</li>
						</ul>

						<Button disabled variant="outline" className="w-full">
							Current Plan
						</Button>
					</Card>

					{/* Premium Monthly */}
					<Card className={cn(
						"relative p-6 transition-all border-2",
						selectedTier === "premium" ? "border-zinc-900 shadow-lg" : "border-zinc-200"
					)}>
						<Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500">
							Most Popular
						</Badge>
						<div className="text-center mb-4">
							<h3 className="text-xl font-bold flex items-center justify-center gap-2">
								Premium <Crown className="w-5 h-5 text-amber-600" />
							</h3>
							<div className="mt-2">
								<span className="text-4xl font-bold">$9.99</span>
								<span className="text-zinc-600">/mo</span>
							</div>
							<p className="text-sm text-zinc-600 mt-2">Full AI-powered insights</p>
						</div>

						<ul className="space-y-3 mb-6">
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span><strong>AI daily financial coach</strong></span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Automatic category detection</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Personalized saving plan</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Subscription tracking + alerts</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Overspending warning system</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>AI Money Patterns Report</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Predictive budgeting</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Monthly financial health score</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Unlimited smart alerts</span>
							</li>
						</ul>

						<Button
							className="w-full bg-zinc-900 hover:bg-zinc-800"
							onClick={() => {
								setSelectedTier("premium");
								handleUpgrade();
							}}
							disabled={isLoading}
						>
							{isLoading && selectedTier === "premium" ? "Processing..." : "Upgrade to Premium"}
						</Button>
					</Card>

					{/* Premium Yearly */}
					<Card className={cn(
						"relative p-6 transition-all border-2",
						selectedTier === "yearly" ? "border-emerald-600 shadow-lg" : "border-zinc-200"
					)}>
						<Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500">
							Best Value - Save 42%
						</Badge>
						<div className="text-center mb-4">
							<h3 className="text-xl font-bold flex items-center justify-center gap-2">
								Premium Yearly <Sparkles className="w-5 h-5 text-emerald-600" />
							</h3>
							<div className="mt-2">
								<div className="text-zinc-400 line-through text-sm">$119.88</div>
								<span className="text-4xl font-bold">$69.99</span>
								<span className="text-zinc-600">/yr</span>
							</div>
							<p className="text-sm text-emerald-700 font-medium mt-2">
								~$5.83/mo • 1 month free!
							</p>
						</div>

						<ul className="space-y-3 mb-6">
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span><strong>Everything in Premium</strong></span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Save $49.89 per year</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Priority support</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Early access to new features</span>
							</li>
							<li className="flex items-start gap-2 text-sm">
								<Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<span>Annual financial report</span>
							</li>
						</ul>

						<Button
							className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
							onClick={() => {
								setSelectedTier("yearly");
								handleUpgrade();
							}}
							disabled={isLoading}
						>
							{isLoading && selectedTier === "yearly" ? "Processing..." : "Get Yearly Premium"}
						</Button>
					</Card>
				</div>

				<div className="mt-6 text-center space-y-2">
					<p className="text-sm text-zinc-600">
						🔒 Secure payment • Cancel anytime • 7-day money-back guarantee
					</p>
					<p className="text-xs text-zinc-500">
						By upgrading, you agree to our terms of service
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface PaywallPromptProps {
	featureName: string;
	featureDescription: string;
	onUpgrade: () => void;
	icon?: React.ReactNode;
}

export function PaywallPrompt({ featureName, featureDescription, onUpgrade, icon }: PaywallPromptProps) {
	return (
		<Card className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
			<div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
				{icon || <Crown className="w-8 h-8 text-white" />}
			</div>
			<h3 className="text-2xl font-bold mb-2">{featureName}</h3>
			<p className="text-zinc-600 mb-6 max-w-md mx-auto">{featureDescription}</p>
			<Button
				size="lg"
				className="bg-zinc-900 hover:bg-zinc-800"
				onClick={onUpgrade}
			>
				<Crown className="w-4 h-4 mr-2" />
				Upgrade to Premium
			</Button>
			<p className="text-sm text-zinc-500 mt-4">Starting at just $9.99/month</p>
		</Card>
	);
}

interface PredictiveAlertProps {
	projectedOverspend: number;
	currentTrend: number;
	isPremium: boolean;
	onUpgrade: () => void;
}

export function PredictiveAlert({ projectedOverspend, currentTrend, isPremium, onUpgrade }: PredictiveAlertProps) {
	if (isPremium) {
		return (
			<Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 p-6">
				<div className="flex items-start gap-4">
					<div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
						<TrendingUp className="w-6 h-6 text-white" />
					</div>
					<div className="flex-1">
						<h4 className="font-bold text-lg text-orange-900">Predictive Budget Alert</h4>
						<p className="text-orange-800 mt-1">
							Based on this week's spending, you're projected to <strong>overspend by ${projectedOverspend.toFixed(2)}</strong> this month.
						</p>
						<p className="text-sm text-orange-700 mt-2">
							Your spending is trending {currentTrend > 0 ? `${currentTrend}% higher` : `${Math.abs(currentTrend)}% lower`} than usual.
						</p>
						<Button size="sm" variant="outline" className="mt-4 border-orange-600 text-orange-700 hover:bg-orange-100">
							Auto-Adjust My Budget
						</Button>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-zinc-300 p-6 relative overflow-hidden">
			<div className="absolute inset-0 backdrop-blur-sm bg-white/60 z-10 flex items-center justify-center">
				<div className="text-center p-6">
					<Crown className="w-12 h-12 mx-auto mb-3 text-amber-600" />
					<h4 className="font-bold text-lg mb-2">Premium Feature Locked</h4>
					<p className="text-sm text-zinc-600 mb-4 max-w-xs">
						Unlock predictive spending alerts to stay ahead of overspending
					</p>
					<Button size="sm" onClick={onUpgrade} className="bg-zinc-900">
						Upgrade Now
					</Button>
				</div>
			</div>
			<div className="blur-sm opacity-40">
				<div className="flex items-start gap-4">
					<div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
						<TrendingUp className="w-6 h-6 text-white" />
					</div>
					<div className="flex-1">
						<h4 className="font-bold text-lg">Predictive Budget Alert</h4>
						<p className="mt-1">Based on this week's spending, you're projected to overspend by $XXX this month.</p>
					</div>
				</div>
			</div>
		</Card>
	);
}
