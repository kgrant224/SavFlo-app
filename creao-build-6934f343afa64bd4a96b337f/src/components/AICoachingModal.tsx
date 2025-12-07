import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, Target, Crown } from "lucide-react";

interface AICoachingInsight {
	type: "positive" | "warning" | "neutral";
	title: string;
	message: string;
	action?: string;
}

interface AICoachingModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isPremium: boolean;
	onUpgrade: () => void;
	insights?: AICoachingInsight[];
	spendingPattern?: {
		weekendSpending: number;
		weekdaySpending: number;
		topCategory: string;
		topCategoryAmount: number;
	};
}

export function AICoachingModal({
	open,
	onOpenChange,
	isPremium,
	onUpgrade,
	insights = [],
	spendingPattern
}: AICoachingModalProps) {
	if (!isPremium) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-2xl flex items-center gap-2">
							<Sparkles className="w-6 h-6 text-amber-500" />
							Personalized AI Coaching
						</DialogTitle>
						<DialogDescription>
							Get tailored advice based on your unique spending habits
						</DialogDescription>
					</DialogHeader>

					<Card className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
						<div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
							<Crown className="w-10 h-10 text-white" />
						</div>
						<h3 className="text-2xl font-bold mb-3">Unlock Your Personal Financial Coach</h3>
						<p className="text-zinc-600 mb-6 max-w-lg mx-auto leading-relaxed">
							Premium members get personalized coaching that analyzes your spending patterns and provides:
						</p>
						<ul className="text-left max-w-md mx-auto space-y-3 mb-6">
							<li className="flex items-start gap-3">
								<TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
								<span className="text-sm">
									<strong>Weekend vs weekday spending insights</strong> - Understand when you spend the most
								</span>
							</li>
							<li className="flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
								<span className="text-sm">
									<strong>Overspending warnings</strong> - Get alerted before you exceed your budget
								</span>
							</li>
							<li className="flex items-start gap-3">
								<Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<span className="text-sm">
									<strong>Personalized strategies</strong> - 3 custom tactics tailored to your habits
								</span>
							</li>
							<li className="flex items-start gap-3">
								<Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
								<span className="text-sm">
									<strong>AI-generated weekly reports</strong> - Deep analysis of your financial health
								</span>
							</li>
						</ul>
						<Button
							size="lg"
							className="bg-zinc-900 hover:bg-zinc-800 text-lg px-8"
							onClick={onUpgrade}
						>
							<Crown className="w-5 h-5 mr-2" />
							Upgrade to Premium - $9.99/mo
						</Button>
						<p className="text-xs text-zinc-500 mt-4">Cancel anytime • 7-day money-back guarantee</p>
					</Card>
				</DialogContent>
			</Dialog>
		);
	}

	const demoInsights: AICoachingInsight[] = insights.length > 0 ? insights : [
		{
			type: "warning",
			title: "Weekend Spending Alert",
			message: "You tend to overspend on weekends by 38%. Try setting a weekend-specific budget.",
			action: "Set Weekend Budget"
		},
		{
			type: "positive",
			title: "Great Progress!",
			message: "You've stayed within your food budget for 3 weeks straight. Keep it up!",
		},
		{
			type: "neutral",
			title: "Subscription Insight",
			message: "You have 4 active subscriptions totaling $47.96/month. Consider reviewing unused ones.",
			action: "Review Subscriptions"
		}
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl flex items-center gap-2">
						<Sparkles className="w-6 h-6 text-amber-500" />
						Your Personal Financial Coach
					</DialogTitle>
					<DialogDescription>
						AI-powered insights based on your spending patterns
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{spendingPattern && (
						<Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
							<h4 className="font-bold text-lg mb-4 flex items-center gap-2">
								<TrendingUp className="w-5 h-5 text-blue-600" />
								Your Spending Pattern
							</h4>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-zinc-600">Weekend Spending</p>
									<p className="text-2xl font-bold text-blue-900">
										${spendingPattern.weekendSpending.toFixed(2)}
									</p>
								</div>
								<div>
									<p className="text-sm text-zinc-600">Weekday Spending</p>
									<p className="text-2xl font-bold text-blue-900">
										${spendingPattern.weekdaySpending.toFixed(2)}
									</p>
								</div>
								<div className="col-span-2 mt-2 pt-4 border-t border-blue-200">
									<p className="text-sm text-zinc-600">Top Category</p>
									<p className="text-xl font-bold text-blue-900">
										{spendingPattern.topCategory} - ${spendingPattern.topCategoryAmount.toFixed(2)}
									</p>
								</div>
							</div>
						</Card>
					)}

					<div className="space-y-3">
						<h4 className="font-semibold text-lg">Personalized Insights</h4>
						{demoInsights.map((insight, idx) => (
							<Card
								key={idx}
								className={
									insight.type === "warning"
										? "border-orange-300 bg-orange-50"
										: insight.type === "positive"
											? "border-green-300 bg-green-50"
											: "border-zinc-300 bg-zinc-50"
								}
							>
								<div className="p-4">
									<div className="flex items-start justify-between mb-2">
										<h5 className="font-semibold flex items-center gap-2">
											{insight.type === "warning" && (
												<AlertTriangle className="w-4 h-4 text-orange-600" />
											)}
											{insight.type === "positive" && (
												<Sparkles className="w-4 h-4 text-green-600" />
											)}
											{insight.title}
										</h5>
										<Badge
											variant="outline"
											className={
												insight.type === "warning"
													? "border-orange-600 text-orange-700"
													: insight.type === "positive"
														? "border-green-600 text-green-700"
														: "border-zinc-600 text-zinc-700"
											}
										>
											{insight.type}
										</Badge>
									</div>
									<p className="text-sm text-zinc-700 mb-3">{insight.message}</p>
									{insight.action && (
										<Button size="sm" variant="outline">
											{insight.action}
										</Button>
									)}
								</div>
							</Card>
						))}
					</div>

					<Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
						<h4 className="font-bold mb-3 flex items-center gap-2">
							<Target className="w-5 h-5 text-purple-600" />
							3 Strategies Tailored to You
						</h4>
						<ol className="space-y-2 list-decimal list-inside text-sm">
							<li className="text-zinc-700">
								<strong>Set a weekend spending limit:</strong> Cap your weekend spending at $150 to stay on track
							</li>
							<li className="text-zinc-700">
								<strong>Meal prep Sundays:</strong> You spend 40% more on food when eating out - try preparing meals
							</li>
							<li className="text-zinc-700">
								<strong>24-hour rule:</strong> Wait 24 hours before purchases over $50 to avoid impulse buys
							</li>
						</ol>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
}
