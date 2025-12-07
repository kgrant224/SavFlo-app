import { useState } from "react";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TransactionManager } from "@/components/dashboard/TransactionManager";
import { BudgetTracker } from "@/components/dashboard/BudgetTracker";
import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { SubscriptionTracker } from "@/components/dashboard/SubscriptionTracker";
import { SpendingAnalytics } from "@/components/dashboard/SpendingAnalytics";
import { Integrations } from "@/components/dashboard/Integrations";
import { LayoutDashboard, Receipt, PieChart, Target, CreditCard, BarChart3, Crown, Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserProfileAccountTier, UserProfileORM } from "@/components/data/orm/orm_user_profile";
import { PricingModal } from "@/components/PricingModal";
import { AICoachingModal } from "@/components/AICoachingModal";
import type { PricingTier } from "@/components/PricingModal";

interface DashboardProps {
	userProfile: UserProfileModel;
	onProfileUpdate: (profile: UserProfileModel) => void;
}

export function Dashboard({ userProfile, onProfileUpdate }: DashboardProps) {
	const [activeTab, setActiveTab] = useState("analytics");
	const [showPricingModal, setShowPricingModal] = useState(false);
	const [showCoachingModal, setShowCoachingModal] = useState(false);

	const isPremium = userProfile.account_tier === UserProfileAccountTier.Premium;

	const handleUpgrade = async (tier: PricingTier) => {
		const orm = UserProfileORM.getInstance();
		const updated = await orm.setUserProfileById(userProfile.id, {
			...userProfile,
			account_tier: UserProfileAccountTier.Premium,
		});
		if (updated.length > 0) {
			onProfileUpdate(updated[0]);
		}
	};

	return (
		<div className="min-h-screen bg-zinc-50">
			<header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-zinc-900">SavFlo</h1>
							<p className="text-sm text-zinc-600">Your personal finance companion</p>
						</div>
						<div className="flex items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowCoachingModal(true)}
								className="flex items-center gap-2"
							>
								<Sparkles className="w-4 h-4" />
								<span className="hidden sm:inline">AI Coach</span>
							</Button>
							{isPremium ? (
								<Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1">
									<Crown className="w-3 h-3 mr-1" />
									Premium
								</Badge>
							) : (
								<Button
									size="sm"
									onClick={() => setShowPricingModal(true)}
									className="bg-zinc-900 hover:bg-zinc-800"
								>
									<Crown className="w-4 h-4 mr-2" />
									Upgrade
								</Button>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
					<TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
						<TabsTrigger value="analytics" className="flex items-center gap-2">
							<BarChart3 className="w-4 h-4" />
							<span className="hidden sm:inline">Analytics</span>
						</TabsTrigger>
						<TabsTrigger value="overview" className="flex items-center gap-2">
							<LayoutDashboard className="w-4 h-4" />
							<span className="hidden sm:inline">Overview</span>
						</TabsTrigger>
						<TabsTrigger value="transactions" className="flex items-center gap-2">
							<Receipt className="w-4 h-4" />
							<span className="hidden sm:inline">Transactions</span>
						</TabsTrigger>
						<TabsTrigger value="budgets" className="flex items-center gap-2">
							<PieChart className="w-4 h-4" />
							<span className="hidden sm:inline">Budgets</span>
						</TabsTrigger>
						<TabsTrigger value="goals" className="flex items-center gap-2">
							<Target className="w-4 h-4" />
							<span className="hidden sm:inline">Goals</span>
						</TabsTrigger>
						<TabsTrigger value="subscriptions" className="flex items-center gap-2">
							<CreditCard className="w-4 h-4" />
							<span className="hidden sm:inline">Subscriptions</span>
						</TabsTrigger>
						<TabsTrigger value="integrations" className="flex items-center gap-2">
							<Link2 className="w-4 h-4" />
							<span className="hidden sm:inline">Integrations</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="analytics">
						<SpendingAnalytics userProfile={userProfile} />
					</TabsContent>

					<TabsContent value="overview">
						<DashboardOverview userProfile={userProfile} onProfileUpdate={onProfileUpdate} />
					</TabsContent>

					<TabsContent value="transactions">
						<TransactionManager userProfile={userProfile} />
					</TabsContent>

					<TabsContent value="budgets">
						<BudgetTracker userProfile={userProfile} />
					</TabsContent>

					<TabsContent value="goals">
						<SavingsGoals userProfile={userProfile} />
					</TabsContent>

					<TabsContent value="subscriptions">
						<SubscriptionTracker userProfile={userProfile} />
					</TabsContent>

					<TabsContent value="integrations">
						<Integrations userProfile={userProfile} />
					</TabsContent>
				</Tabs>
			</main>

			<PricingModal
				open={showPricingModal}
				onOpenChange={setShowPricingModal}
				currentTier={isPremium ? "premium" : "free"}
				onUpgrade={handleUpgrade}
			/>

			<AICoachingModal
				open={showCoachingModal}
				onOpenChange={setShowCoachingModal}
				isPremium={isPremium}
				onUpgrade={() => {
					setShowCoachingModal(false);
					setShowPricingModal(true);
				}}
			/>
		</div>
	);
}
