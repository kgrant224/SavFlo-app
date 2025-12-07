import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { SubscriptionORM, SubscriptionBillingCycle } from "@/components/data/orm/orm_subscription";
import type { SubscriptionModel } from "@/components/data/orm/orm_subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
	PlusCircle,
	CreditCard,
	DollarSign,
	Calendar,
	TrendingUp,
	AlertCircle,
	Sparkles,
	ExternalLink,
	Edit,
	Trash2,
	CheckCircle2,
	XCircle,
	Music,
	Film,
	Dumbbell,
	Code,
	Newspaper,
	ShoppingBag,
	Briefcase,
	Home,
	Zap,
	Utensils,
} from "lucide-react";
import { toast } from "sonner";

const subscriptionSchema = z.object({
	serviceName: z.string().min(1, "Service name is required"),
	amount: z.string().min(1, "Amount is required"),
	billingCycle: z.string().min(1, "Billing cycle is required"),
	nextBillingDate: z.string().min(1, "Next billing date is required"),
	category: z.string().min(1, "Category is required"),
	cancellationUrl: z.string().optional(),
	isActive: z.boolean().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionTrackerProps {
	userProfile: UserProfileModel;
}

const CATEGORIES = [
	{ value: "streaming", label: "Streaming", icon: Film, color: "bg-purple-100 text-purple-600" },
	{ value: "music", label: "Music", icon: Music, color: "bg-pink-100 text-pink-600" },
	{ value: "fitness", label: "Fitness", icon: Dumbbell, color: "bg-green-100 text-green-600" },
	{ value: "software", label: "Software", icon: Code, color: "bg-blue-100 text-blue-600" },
	{ value: "news", label: "News", icon: Newspaper, color: "bg-orange-100 text-orange-600" },
	{ value: "shopping", label: "Shopping", icon: ShoppingBag, color: "bg-rose-100 text-rose-600" },
	{ value: "productivity", label: "Productivity", icon: Briefcase, color: "bg-indigo-100 text-indigo-600" },
	{ value: "utilities", label: "Utilities", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
	{ value: "food", label: "Food & Delivery", icon: Utensils, color: "bg-amber-100 text-amber-600" },
	{ value: "other", label: "Other", icon: CreditCard, color: "bg-zinc-100 text-zinc-600" },
];

const BILLING_CYCLES = [
	{ value: SubscriptionBillingCycle.Weekly.toString(), label: "Weekly", multiplier: 52 },
	{ value: SubscriptionBillingCycle.Monthly.toString(), label: "Monthly", multiplier: 12 },
	{ value: SubscriptionBillingCycle.Yearly.toString(), label: "Yearly", multiplier: 1 },
];

export function SubscriptionTracker({ userProfile }: SubscriptionTrackerProps) {
	const [subscriptions, setSubscriptions] = useState<SubscriptionModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSubscription, setEditingSubscription] = useState<SubscriptionModel | null>(null);
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [sortBy, setSortBy] = useState<"renewal" | "cost" | "category">("renewal");
	const [showActiveOnly, setShowActiveOnly] = useState(true);

	const form = useForm<SubscriptionFormData>({
		resolver: zodResolver(subscriptionSchema),
		defaultValues: {
			serviceName: "",
			amount: "",
			billingCycle: SubscriptionBillingCycle.Monthly.toString(),
			nextBillingDate: "",
			category: "other",
			cancellationUrl: "",
			isActive: true,
		},
	});

	useEffect(() => {
		loadSubscriptions();
	}, []);

	const loadSubscriptions = async () => {
		try {
			const orm = SubscriptionORM.getInstance();
			const allSubscriptions = await orm.getAllSubscription();
			setSubscriptions(allSubscriptions);
		} catch (error) {
			console.error("Error loading subscriptions:", error);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: SubscriptionFormData) => {
		try {
			const orm = SubscriptionORM.getInstance();

			const subscriptionData: Partial<SubscriptionModel> = {
				user_id: userProfile.id,
				service_name: data.serviceName,
				amount: parseFloat(data.amount),
				billing_cycle: parseInt(data.billingCycle) as SubscriptionBillingCycle,
				next_billing_date: data.nextBillingDate,
				category: data.category,
				cancellation_url: data.cancellationUrl || null,
				is_active: data.isActive ?? true,
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
			};

			if (editingSubscription) {
				await orm.setSubscriptionById(editingSubscription.id, {
					...editingSubscription,
					...subscriptionData,
				} as SubscriptionModel);
				toast.success("Subscription updated successfully");
			} else {
				await orm.insertSubscription([subscriptionData as SubscriptionModel]);
				toast.success("Subscription added successfully", {
					description: "We'll remind you before the next billing date!",
				});
			}

			form.reset();
			setDialogOpen(false);
			setEditingSubscription(null);
			await loadSubscriptions();
		} catch (error) {
			console.error("Error saving subscription:", error);
			toast.error("Failed to save subscription");
		}
	};

	const handleDeleteSubscription = async (id: string) => {
		try {
			const orm = SubscriptionORM.getInstance();
			await orm.deleteSubscriptionById(id);
			toast.success("Subscription removed");
			await loadSubscriptions();
		} catch (error) {
			console.error("Error deleting subscription:", error);
			toast.error("Failed to remove subscription");
		}
	};

	const handleToggleActive = async (subscription: SubscriptionModel) => {
		try {
			const orm = SubscriptionORM.getInstance();
			await orm.setSubscriptionById(subscription.id, {
				...subscription,
				is_active: !subscription.is_active,
			});
			toast.success(subscription.is_active ? "Subscription paused" : "Subscription activated");
			await loadSubscriptions();
		} catch (error) {
			console.error("Error toggling subscription:", error);
			toast.error("Failed to update subscription");
		}
	};

	const openEditDialog = (subscription: SubscriptionModel) => {
		setEditingSubscription(subscription);
		form.reset({
			serviceName: subscription.service_name,
			amount: subscription.amount.toString(),
			billingCycle: subscription.billing_cycle.toString(),
			nextBillingDate: subscription.next_billing_date,
			category: subscription.category,
			cancellationUrl: subscription.cancellation_url || "",
			isActive: subscription.is_active,
		});
		setDialogOpen(true);
	};

	const getDaysUntilRenewal = (nextBillingDate: string) => {
		const today = new Date();
		const billing = new Date(nextBillingDate);
		const diff = billing.getTime() - today.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	};

	const getYearlyCost = (amount: number, cycle: SubscriptionBillingCycle) => {
		const multiplier = BILLING_CYCLES.find(bc => bc.value === cycle.toString())?.multiplier || 12;
		return amount * multiplier;
	};

	const getTotalMonthlySpend = () => {
		return subscriptions
			.filter(sub => sub.is_active)
			.reduce((total, sub) => {
				const yearlyCost = getYearlyCost(sub.amount, sub.billing_cycle);
				return total + (yearlyCost / 12);
			}, 0);
	};

	const getTotalYearlySpend = () => {
		return subscriptions
			.filter(sub => sub.is_active)
			.reduce((total, sub) => total + getYearlyCost(sub.amount, sub.billing_cycle), 0);
	};

	const getCategorySpending = () => {
		const categoryTotals: Record<string, number> = {};
		subscriptions
			.filter(sub => sub.is_active)
			.forEach(sub => {
				const yearlyCost = getYearlyCost(sub.amount, sub.billing_cycle);
				categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + yearlyCost;
			});
		return categoryTotals;
	};

	const getUpcomingRenewals = () => {
		const now = new Date();
		const next7Days = new Date();
		next7Days.setDate(now.getDate() + 7);

		return subscriptions.filter(sub => {
			if (!sub.is_active) return false;
			const renewalDate = new Date(sub.next_billing_date);
			return renewalDate >= now && renewalDate <= next7Days;
		});
	};

	const getInsights = () => {
		const insights = [];
		const monthlyTotal = getTotalMonthlySpend();
		const yearlyTotal = getTotalYearlySpend();
		const categorySpending = getCategorySpending();
		const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

		insights.push({
			type: "spending" as const,
			message: `You're spending $${monthlyTotal.toFixed(2)}/month on subscriptions.`,
		});

		insights.push({
			type: "yearly" as const,
			message: `That's $${yearlyTotal.toFixed(2)}/year in total subscription costs.`,
		});

		if (topCategory) {
			const categoryLabel = CATEGORIES.find(c => c.value === topCategory[0])?.label || topCategory[0];
			insights.push({
				type: "category" as const,
				message: `You're paying $${(topCategory[1] / 12).toFixed(2)}/month for ${categoryLabel} services.`,
			});
		}

		const upcomingRenewals = getUpcomingRenewals();
		if (upcomingRenewals.length > 0) {
			const totalUpcoming = upcomingRenewals.reduce((sum, sub) => sum + sub.amount, 0);
			insights.push({
				type: "renewal" as const,
				message: `You have ${upcomingRenewals.length} subscription${upcomingRenewals.length > 1 ? 's' : ''} renewing in the next 7 days ($${totalUpcoming.toFixed(2)}).`,
			});
		}

		const inactiveCount = subscriptions.filter(s => !s.is_active).length;
		if (inactiveCount > 0) {
			insights.push({
				type: "inactive" as const,
				message: `You have ${inactiveCount} paused subscription${inactiveCount > 1 ? 's' : ''}. Consider canceling if no longer needed.`,
			});
		}

		return insights;
	};

	const getSortedAndFilteredSubscriptions = () => {
		let filtered = subscriptions;

		if (showActiveOnly) {
			filtered = filtered.filter(sub => sub.is_active);
		}

		if (filterCategory !== "all") {
			filtered = filtered.filter(sub => sub.category === filterCategory);
		}

		return filtered.sort((a, b) => {
			if (sortBy === "renewal") {
				return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
			} else if (sortBy === "cost") {
				const aCost = getYearlyCost(a.amount, a.billing_cycle);
				const bCost = getYearlyCost(b.amount, b.billing_cycle);
				return bCost - aCost;
			} else if (sortBy === "category") {
				return a.category.localeCompare(b.category);
			}
			return 0;
		});
	};

	const getCategoryIcon = (categoryValue: string) => {
		const category = CATEGORIES.find(c => c.value === categoryValue);
		return category || CATEGORIES[CATEGORIES.length - 1];
	};

	const getBillingCycleLabel = (cycle: SubscriptionBillingCycle) => {
		return BILLING_CYCLES.find(bc => bc.value === cycle.toString())?.label || "Monthly";
	};

	const sortedSubscriptions = getSortedAndFilteredSubscriptions();
	const insights = getInsights();
	const categorySpending = getCategorySpending();
	const topCategories = Object.entries(categorySpending)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3);

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Subscriptions</h2>
				<p className="text-zinc-600 mt-2">
					Track and manage all your recurring payments
				</p>
			</div>

			{/* Main Subscriptions Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Your Subscriptions</CardTitle>
							<CardDescription>Manage all your recurring payments in one place</CardDescription>
						</div>
						<Dialog
							open={dialogOpen}
							onOpenChange={(open) => {
								setDialogOpen(open);
								if (!open) {
									setEditingSubscription(null);
									form.reset();
								}
							}}
						>
							<DialogTrigger asChild>
								<Button>
									<PlusCircle className="w-4 h-4 mr-2" />
									Add Subscription
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>
										{editingSubscription ? "Edit Subscription" : "Add New Subscription"}
									</DialogTitle>
									<DialogDescription>
										{editingSubscription
											? "Update your subscription details"
											: "Track a new recurring subscription"}
									</DialogDescription>
								</DialogHeader>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="serviceName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Service Name</FormLabel>
													<FormControl>
														<Input placeholder="Netflix, Spotify, etc..." {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="amount"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Amount</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															placeholder="9.99"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="billingCycle"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Billing Cycle</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select billing cycle" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{BILLING_CYCLES.map(cycle => (
																<SelectItem key={cycle.value} value={cycle.value}>
																	{cycle.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="nextBillingDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Next Billing Date</FormLabel>
													<FormControl>
														<Input type="date" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="category"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Category</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select category" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{CATEGORIES.map(cat => (
																<SelectItem key={cat.value} value={cat.value}>
																	{cat.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="cancellationUrl"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Cancellation URL (Optional)</FormLabel>
													<FormControl>
														<Input
															type="url"
															placeholder="https://..."
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Link to manage or cancel this subscription
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button type="submit" className="w-full">
											{editingSubscription ? "Update Subscription" : "Add Subscription"}
										</Button>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading subscriptions...</p>
					) : subscriptions.length === 0 ? (
						<div className="text-center py-12">
							<CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">No subscriptions tracked</h3>
							<p className="text-muted-foreground mb-4">
								Start tracking your recurring payments to understand your spending!
							</p>
							<Button onClick={() => setDialogOpen(true)}>
								<PlusCircle className="w-4 h-4 mr-2" />
								Add Your First Subscription
							</Button>
						</div>
					) : (
						<div className="space-y-6">
							{/* Filters and Sorting */}
							<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
								<div className="flex gap-2">
									<Button
										variant={showActiveOnly ? "default" : "outline"}
										size="sm"
										onClick={() => setShowActiveOnly(true)}
									>
										Active
									</Button>
									<Button
										variant={!showActiveOnly ? "default" : "outline"}
										size="sm"
										onClick={() => setShowActiveOnly(false)}
									>
										All
									</Button>
								</div>
								<div className="flex gap-2">
									<Select
										value={filterCategory}
										onValueChange={setFilterCategory}
									>
										<SelectTrigger className="w-[140px]">
											<SelectValue placeholder="Category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Categories</SelectItem>
											{CATEGORIES.map(cat => (
												<SelectItem key={cat.value} value={cat.value}>
													{cat.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
										<SelectTrigger className="w-[140px]">
											<SelectValue placeholder="Sort by" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="renewal">Renewal Date</SelectItem>
											<SelectItem value="cost">Cost</SelectItem>
											<SelectItem value="category">Category</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<Separator />

							{/* Subscriptions Grid */}
							<div className="grid gap-4 md:grid-cols-2">
								{sortedSubscriptions.map((subscription) => {
									const categoryInfo = getCategoryIcon(subscription.category);
									const CategoryIcon = categoryInfo.icon;
									const daysUntilRenewal = getDaysUntilRenewal(subscription.next_billing_date);
									const isUpcoming = daysUntilRenewal <= 7 && daysUntilRenewal >= 0;
									const yearlyCost = getYearlyCost(
										subscription.amount,
										subscription.billing_cycle
									);

									return (
										<Card
											key={subscription.id}
											className={
												!subscription.is_active
													? "opacity-60 border-dashed"
													: isUpcoming
													? "border-amber-200 bg-amber-50/30"
													: ""
											}
										>
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-3">
														<div className={`p-2 rounded-lg ${categoryInfo.color}`}>
															<CategoryIcon className="w-5 h-5" />
														</div>
														<div>
															<CardTitle className="text-lg flex items-center gap-2">
																{subscription.service_name}
																{!subscription.is_active && (
																	<XCircle className="w-4 h-4 text-zinc-400" />
																)}
															</CardTitle>
															<div className="flex items-center gap-2 mt-1">
																<Badge variant="outline" className="text-xs">
																	{categoryInfo.label}
																</Badge>
																{isUpcoming && subscription.is_active && (
																	<Badge
																		variant="secondary"
																		className="text-xs bg-amber-100 text-amber-700"
																	>
																		<AlertCircle className="w-3 h-3 mr-1" />
																		Renews in {daysUntilRenewal} days
																	</Badge>
																)}
															</div>
														</div>
													</div>
													<div className="flex items-center gap-1">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditDialog(subscription)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleDeleteSubscription(subscription.id)}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Cost Information */}
												<div className="grid grid-cols-2 gap-4">
													<div>
														<p className="text-xs text-muted-foreground mb-1">
															{getBillingCycleLabel(subscription.billing_cycle)} Cost
														</p>
														<p className="text-xl font-bold">
															${subscription.amount.toFixed(2)}
														</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground mb-1">
															Yearly Cost
														</p>
														<p className="text-xl font-bold text-zinc-600">
															${yearlyCost.toFixed(2)}
														</p>
													</div>
												</div>

												{/* Next Billing Date */}
												<div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
													<div className="flex items-center gap-2 mb-1">
														<Calendar className="w-4 h-4 text-zinc-600" />
														<span className="text-xs font-semibold text-zinc-900">
															Next Billing Date
														</span>
													</div>
													<p className="text-sm text-zinc-700">
														{new Date(subscription.next_billing_date).toLocaleDateString(
															"en-US",
															{
																month: "long",
																day: "numeric",
																year: "numeric",
															}
														)}
														{subscription.is_active &&
															daysUntilRenewal >= 0 &&
															` (${daysUntilRenewal} days)`}
													</p>
												</div>

												{/* Action Buttons */}
												<div className="flex gap-2 pt-2 border-t">
													<Button
														variant="outline"
														size="sm"
														className="flex-1"
														onClick={() => handleToggleActive(subscription)}
													>
														{subscription.is_active ? (
															<>
																<XCircle className="w-4 h-4 mr-1" />
																Pause
															</>
														) : (
															<>
																<CheckCircle2 className="w-4 h-4 mr-1" />
																Activate
															</>
														)}
													</Button>
													{subscription.cancellation_url && (
														<Button
															variant="outline"
															size="sm"
															className="flex-1"
															onClick={() =>
																window.open(
																	subscription.cancellation_url!,
																	"_blank"
																)
															}
														>
															<ExternalLink className="w-4 h-4 mr-1" />
															Manage
														</Button>
													)}
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dashboard Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${getTotalMonthlySpend().toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">
							${getTotalYearlySpend().toFixed(2)}/year
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
						<CreditCard className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{subscriptions.filter(s => s.is_active).length}
						</div>
						<p className="text-xs text-muted-foreground">
							{subscriptions.filter(s => !s.is_active).length} paused
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
						<AlertCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{getUpcomingRenewals().length}</div>
						<p className="text-xs text-muted-foreground">
							Next 7 days
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Spending Insights */}
			{insights.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Sparkles className="w-5 h-5 text-blue-600" />
							AI Insights
						</CardTitle>
						<CardDescription>Smart analysis of your subscription spending</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{insights.map((insight, index) => (
								<div
									key={index}
									className={`p-3 rounded-lg flex items-start gap-2 ${
										insight.type === "renewal"
											? "bg-amber-50 border border-amber-200"
											: insight.type === "inactive"
											? "bg-zinc-50 border border-zinc-200"
											: "bg-blue-50 border border-blue-200"
									}`}
								>
									<TrendingUp
										className={`w-4 h-4 mt-0.5 ${
											insight.type === "renewal"
												? "text-amber-600"
												: insight.type === "inactive"
												? "text-zinc-600"
												: "text-blue-600"
										}`}
									/>
									<p className="text-sm flex-1">{insight.message}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Category Breakdown */}
			{topCategories.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Spending by Category</CardTitle>
						<CardDescription>Your top subscription categories this year</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{topCategories.map(([category, amount]) => {
								const categoryInfo = getCategoryIcon(category);
								const CategoryIcon = categoryInfo.icon;
								const percentage = (amount / getTotalYearlySpend()) * 100;

								return (
									<div key={category} className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-2">
												<div className={`p-1.5 rounded ${categoryInfo.color}`}>
													<CategoryIcon className="w-3 h-3" />
												</div>
												<span className="font-medium">{categoryInfo.label}</span>
											</div>
											<div className="text-right">
												<div className="font-semibold">${(amount / 12).toFixed(2)}/mo</div>
												<div className="text-xs text-muted-foreground">
													${amount.toFixed(2)}/yr
												</div>
											</div>
										</div>
										<Progress value={percentage} className="h-2" />
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
