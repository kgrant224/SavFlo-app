import { useEffect, useState } from "react";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionORM } from "@/components/data/orm/orm_transaction";
import { BudgetORM } from "@/components/data/orm/orm_budget";
import { SavingsGoalORM } from "@/components/data/orm/orm_savings_goal";
import { DailyInsightORM } from "@/components/data/orm/orm_daily_insight";
import { AlertORM } from "@/components/data/orm/orm_alert";
import type { TransactionModel } from "@/components/data/orm/orm_transaction";
import type { BudgetModel } from "@/components/data/orm/orm_budget";
import type { SavingsGoalModel } from "@/components/data/orm/orm_savings_goal";
import type { DailyInsightModel } from "@/components/data/orm/orm_daily_insight";
import type { AlertModel } from "@/components/data/orm/orm_alert";
import { useGenerateDailyInsight } from "@/hooks/use-openai-gpt-chat";
import { Sparkles, TrendingUp, TrendingDown, DollarSign, Bell, Crown } from "lucide-react";
import { toast } from "sonner";
import { UserProfileAccountTier, UserProfileORM } from "@/components/data/orm/orm_user_profile";
import { AlertSeverity, AlertAlertType } from "@/components/data/orm/orm_alert";
import { PricingModal, PredictiveAlert } from "@/components/PricingModal";
import type { PricingTier } from "@/components/PricingModal";

interface DashboardOverviewProps {
	userProfile: UserProfileModel;
	onProfileUpdate?: (profile: UserProfileModel) => void;
}

export function DashboardOverview({ userProfile, onProfileUpdate }: DashboardOverviewProps) {
	const [loading, setLoading] = useState(true);
	const [transactions, setTransactions] = useState<TransactionModel[]>([]);
	const [budgets, setBudgets] = useState<BudgetModel[]>([]);
	const [goals, setGoals] = useState<SavingsGoalModel[]>([]);
	const [dailyInsight, setDailyInsight] = useState<DailyInsightModel | null>(null);
	const [alerts, setAlerts] = useState<AlertModel[]>([]);
	const [showPricingModal, setShowPricingModal] = useState(false);
	const [pricingHighlight, setPricingHighlight] = useState<string>("");

	const generateInsight = useGenerateDailyInsight();

	useEffect(() => {
		loadDashboardData();
	}, []);

	const loadDashboardData = async () => {
		try {
			const transactionOrm = TransactionORM.getInstance();
			const budgetOrm = BudgetORM.getInstance();
			const goalOrm = SavingsGoalORM.getInstance();
			const insightOrm = DailyInsightORM.getInstance();
			const alertOrm = AlertORM.getInstance();

			const [txs, buds, gls, insights, alts] = await Promise.all([
				transactionOrm.getAllTransaction(),
				budgetOrm.getAllBudget(),
				goalOrm.getAllSavingsGoal(),
				insightOrm.getAllDailyInsight(),
				alertOrm.getAllAlert(),
			]);

			setTransactions(txs);
			setBudgets(buds);
			setGoals(gls);
			setAlerts(alts.filter(a => !a.is_read).slice(0, 5));

			const today = new Date().toISOString().split("T")[0];
			const todayInsight = insights.find(i => i.insight_date.startsWith(today));
			setDailyInsight(todayInsight || null);
		} catch (error) {
			console.error("Error loading dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateInsight = async () => {
		if (!isPremium) {
			setPricingHighlight("AI daily financial coach with personalized insights based on your spending patterns");
			setShowPricingModal(true);
			return;
		}

		if (generateInsight.isPending) return;

		try {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayTxs = transactions.filter(t =>
				t.transaction_time.startsWith(yesterday.toISOString().split("T")[0])
			);

			if (yesterdayTxs.length === 0) {
				toast.info("No transactions from yesterday to analyze");
				return;
			}

			const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
			const totalSpent = budgets.reduce((sum, b) => sum + b.current_spent, 0);

			const categorySpending = budgets.map(b => ({
				category: b.category_name,
				amount: b.current_spent,
				percentage: totalSpent > 0 ? (b.current_spent / totalSpent) * 100 : 0,
			}));

			await generateInsight.mutateAsync({
				transactions: yesterdayTxs.map(t => ({
					id: t.id,
					amount: t.amount,
					category: String(t.category),
					description: t.description || "",
					date: t.transaction_time,
				})),
				budgetStatus: {
					totalBudget,
					spent: totalSpent,
					remaining: totalBudget - totalSpent,
					categories: budgets.map(b => ({
						name: b.category_name,
						budget: b.monthly_limit,
						spent: b.current_spent,
					})),
				},
				spendingPatterns: {
					averageDaily: totalSpent / 30,
					topCategories: categorySpending.slice(0, 3),
					trends: {},
				},
			});

			toast.success("Daily insight generated!");
			await loadDashboardData();
		} catch (error) {
			console.error("Error generating insight:", error);
			toast.error("Failed to generate insight");
		}
	};

	const handleUpgrade = async (tier: PricingTier) => {
		const orm = UserProfileORM.getInstance();
		const updated = await orm.setUserProfileById(userProfile.id, {
			...userProfile,
			account_tier: UserProfileAccountTier.Premium,
		});
		if (updated.length > 0 && onProfileUpdate) {
			onProfileUpdate(updated[0]);
		}
	};

	const openPricingModal = (feature: string) => {
		setPricingHighlight(feature);
		setShowPricingModal(true);
	};

	const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
	const totalSpent = budgets.reduce((sum, b) => sum + b.current_spent, 0);
	const budgetRemaining = totalBudget - totalSpent;
	const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

	const activeGoals = goals.filter(g => !g.is_completed);
	const totalGoalProgress = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
	const totalGoalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);

	const isPremium = userProfile.account_tier === UserProfileAccountTier.Premium;

	if (loading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const projectedOverspend = totalBudget > 0 ? (totalSpent / (new Date().getDate() / 30) - totalBudget) : 0;
	const spendingTrend = budgets.length > 0 ? ((totalSpent / totalBudget) - 0.8) * 100 : 0;

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Dashboard Overview</h2>
				<p className="text-zinc-600 mt-2">
					Your complete financial snapshot and personalized insights
				</p>
			</div>

			{!isPremium && (
				<Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
					<Crown className="h-4 w-4 text-amber-600" />
					<AlertDescription className="flex items-center justify-between">
						<span className="text-amber-900">
							Unlock AI daily insights, predictive alerts, and personalized coaching for just $9.99/month
						</span>
						<Button
							size="sm"
							variant="outline"
							className="ml-4"
							onClick={() => openPricingModal("Full access to all premium features")}
						>
							View Plans
						</Button>
					</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${budgetRemaining.toFixed(2)}
						</div>
						<p className="text-xs text-muted-foreground">
							${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)} spent
						</p>
						<Progress value={budgetPercentage} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${totalGoalProgress.toFixed(2)}
						</div>
						<p className="text-xs text-muted-foreground">
							{activeGoals.length} active {activeGoals.length === 1 ? "goal" : "goals"} • ${totalGoalTarget.toFixed(2)} target
						</p>
						<Progress
							value={totalGoalTarget > 0 ? (totalGoalProgress / totalGoalTarget) * 100 : 0}
							className="mt-2"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
						<TrendingDown className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{transactions.length}</div>
						<p className="text-xs text-muted-foreground">
							Total transactions recorded
						</p>
					</CardContent>
				</Card>
			</div>

			{projectedOverspend > 50 && transactions.length > 3 && (
				<PredictiveAlert
					projectedOverspend={projectedOverspend}
					currentTrend={spendingTrend}
					isPremium={isPremium}
					onUpgrade={() => openPricingModal("Predictive spending alerts that warn you before you overspend")}
				/>
			)}

			{dailyInsight && isPremium && (
				<Card className="border-zinc-900 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Sparkles className="w-5 h-5" />
							Today's AI Insight
						</CardTitle>
						<CardDescription className="text-zinc-300">
							{new Date(dailyInsight.insight_date).toLocaleDateString("en-US", {
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-zinc-100 leading-relaxed">{dailyInsight.insight_text}</p>
						<Badge variant="secondary" className="bg-zinc-700 text-white">
							{dailyInsight.category}
						</Badge>
					</CardContent>
				</Card>
			)}

			{!dailyInsight && transactions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Sparkles className="w-5 h-5" />
							{isPremium ? "Daily AI Insight" : "AI Daily Insight (Premium)"}
						</CardTitle>
						<CardDescription>
							{isPremium
								? "Get personalized insights about your spending habits"
								: "Unlock AI-powered coaching based on your unique spending patterns"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={handleGenerateInsight}
							disabled={generateInsight.isPending}
							className="w-full"
						>
							{!isPremium && <Crown className="w-4 h-4 mr-2" />}
							{generateInsight.isPending ? "Generating insight..." : isPremium ? "Generate Today's Insight" : "Unlock Premium to Generate Insights"}
						</Button>
					</CardContent>
				</Card>
			)}

			{alerts.length > 0 && isPremium && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="w-5 h-5" />
							Smart Alerts
						</CardTitle>
						<CardDescription>{alerts.length} unread alerts</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{alerts.map((alert) => (
							<Alert
								key={alert.id}
								variant={alert.severity === AlertSeverity.Critical ? "destructive" : "default"}
							>
								<AlertDescription className="flex items-start justify-between">
									<div>
										<p className="font-medium">{AlertAlertType[alert.alert_type].replace(/([A-Z])/g, " $1").trim()}</p>
										<p className="text-sm mt-1">{alert.message}</p>
									</div>
									<Badge variant="outline" className="ml-2">
										{AlertSeverity[alert.severity]}
									</Badge>
								</AlertDescription>
							</Alert>
						))}
					</CardContent>
				</Card>
			)}

			<PricingModal
				open={showPricingModal}
				onOpenChange={setShowPricingModal}
				currentTier={isPremium ? "premium" : "free"}
				onUpgrade={handleUpgrade}
				highlightFeature={pricingHighlight}
			/>
		</div>
	);
}
