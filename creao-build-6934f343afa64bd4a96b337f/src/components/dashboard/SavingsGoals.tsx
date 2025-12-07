import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { SavingsGoalORM } from "@/components/data/orm/orm_savings_goal";
import type { SavingsGoalModel } from "@/components/data/orm/orm_savings_goal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	PlusCircle,
	Target,
	TrendingUp,
	DollarSign,
	Calendar,
	Trophy,
	Sparkles,
	CheckCircle2,
	AlertCircle,
	PiggyBank,
	Home,
	Car,
	Plane,
	Heart,
	GraduationCap,
	Gift,
	Wallet,
	Clock,
	ArrowUp,
	ArrowDown,
	Edit,
	Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const goalSchema = z.object({
	goalName: z.string().min(1, "Goal name is required"),
	targetAmount: z.string().min(1, "Target amount is required"),
	currentAmount: z.string().optional(),
	deadline: z.string().optional(),
	priorityLevel: z.string().optional(),
	icon: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface SavingsGoalsProps {
	userProfile: UserProfileModel;
}

const GOAL_ICONS = [
	{ icon: Home, name: "Home", color: "text-blue-500" },
	{ icon: Car, name: "Car", color: "text-green-500" },
	{ icon: Plane, name: "Vacation", color: "text-purple-500" },
	{ icon: GraduationCap, name: "Education", color: "text-orange-500" },
	{ icon: Gift, name: "Gift", color: "text-pink-500" },
	{ icon: Heart, name: "Wedding", color: "text-red-500" },
	{ icon: Wallet, name: "Emergency Fund", color: "text-amber-500" },
	{ icon: Target, name: "General", color: "text-zinc-500" },
];

const MILESTONES = [
	{ percentage: 25, label: "25% Complete", message: "Great start! You're building momentum!" },
	{ percentage: 50, label: "Halfway There!", message: "Amazing progress! Keep it going!" },
	{ percentage: 75, label: "75% Complete", message: "You're so close! Don't give up now!" },
	{ percentage: 100, label: "Goal Achieved!", message: "Congratulations! You did it!" },
];

interface GoalContribution {
	date: string;
	amount: number;
}

export function SavingsGoals({ userProfile }: SavingsGoalsProps) {
	const [goals, setGoals] = useState<SavingsGoalModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingGoal, setEditingGoal] = useState<SavingsGoalModel | null>(null);
	const [selectedGoal, setSelectedGoal] = useState<SavingsGoalModel | null>(null);
	const [contributionAmount, setContributionAmount] = useState("");
	const [sortBy, setSortBy] = useState<"deadline" | "progress" | "priority">("deadline");
	const [filterBy, setFilterBy] = useState<"all" | "active" | "completed">("all");

	const form = useForm<GoalFormData>({
		resolver: zodResolver(goalSchema),
		defaultValues: {
			goalName: "",
			targetAmount: "",
			currentAmount: "0",
			deadline: "",
			priorityLevel: "2",
			icon: "General",
		},
	});

	useEffect(() => {
		loadGoals();
	}, []);

	const loadGoals = async () => {
		try {
			const orm = SavingsGoalORM.getInstance();
			const allGoals = await orm.getAllSavingsGoal();
			setGoals(allGoals);
		} catch (error) {
			console.error("Error loading savings goals:", error);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: GoalFormData) => {
		try {
			const orm = SavingsGoalORM.getInstance();

			const goalData: Partial<SavingsGoalModel> = {
				user_id: userProfile.id,
				goal_name: data.goalName,
				target_amount: parseFloat(data.targetAmount),
				current_amount: data.currentAmount ? parseFloat(data.currentAmount) : 0,
				deadline: data.deadline || null,
				priority_level: data.priorityLevel ? parseInt(data.priorityLevel) : 2,
				is_completed: false,
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
			};

			if (editingGoal) {
				await orm.setSavingsGoalById(editingGoal.id, {
					...editingGoal,
					...goalData,
				} as SavingsGoalModel);
				toast.success("Goal updated successfully");
			} else {
				await orm.insertSavingsGoal([goalData as SavingsGoalModel]);
				toast.success("Goal created successfully", {
					description: "Start tracking your progress!",
				});
			}

			form.reset();
			setDialogOpen(false);
			setEditingGoal(null);
			await loadGoals();
		} catch (error) {
			console.error("Error saving goal:", error);
			toast.error("Failed to save goal");
		}
	};

	const handleAddContribution = async (goal: SavingsGoalModel) => {
		if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
			toast.error("Please enter a valid amount");
			return;
		}

		try {
			const orm = SavingsGoalORM.getInstance();
			const newAmount = goal.current_amount + parseFloat(contributionAmount);
			const isCompleted = newAmount >= goal.target_amount;

			// Check for milestone achievements
			const oldPercentage = (goal.current_amount / goal.target_amount) * 100;
			const newPercentage = (newAmount / goal.target_amount) * 100;

			const achievedMilestone = MILESTONES.find(
				m => oldPercentage < m.percentage && newPercentage >= m.percentage
			);

			await orm.setSavingsGoalById(goal.id, {
				...goal,
				current_amount: newAmount,
				is_completed: isCompleted,
			});

			if (achievedMilestone) {
				toast.success(achievedMilestone.label, {
					description: achievedMilestone.message,
					duration: 5000,
				});
			} else {
				toast.success(`Added $${parseFloat(contributionAmount).toFixed(2)}`, {
					description: `New balance: $${newAmount.toFixed(2)}`,
				});
			}

			setContributionAmount("");
			setSelectedGoal(null);
			await loadGoals();
		} catch (error) {
			console.error("Error adding contribution:", error);
			toast.error("Failed to add contribution");
		}
	};

	const handleDeleteGoal = async (id: string) => {
		try {
			const orm = SavingsGoalORM.getInstance();
			await orm.deleteSavingsGoalById(id);
			toast.success("Goal deleted");
			await loadGoals();
		} catch (error) {
			console.error("Error deleting goal:", error);
			toast.error("Failed to delete goal");
		}
	};

	const getProgress = (goal: SavingsGoalModel) => {
		return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
	};

	const getDaysRemaining = (deadline: string | null | undefined) => {
		if (!deadline) return null;
		const today = new Date();
		const deadlineDate = new Date(deadline);
		const diff = deadlineDate.getTime() - today.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	};

	const getAIInsight = (goal: SavingsGoalModel) => {
		const progress = getProgress(goal);
		const daysRemaining = getDaysRemaining(goal.deadline);
		const remaining = goal.target_amount - goal.current_amount;

		if (progress >= 100) {
			return {
				type: "success" as const,
				message: `Congratulations! You've achieved your ${goal.goal_name} goal!`,
			};
		}

		if (daysRemaining !== null && daysRemaining > 0) {
			const dailySavings = remaining / daysRemaining;
			const weeklySavings = dailySavings * 7;

			if (progress >= 75) {
				return {
					type: "positive" as const,
					message: `You're ahead of schedule! Just $${weeklySavings.toFixed(2)}/week to reach your goal.`,
				};
			} else if (progress >= 50) {
				return {
					type: "neutral" as const,
					message: `Saving $${weeklySavings.toFixed(2)} per week will keep you on track.`,
				};
			} else if (daysRemaining < 30) {
				return {
					type: "warning" as const,
					message: `Only ${daysRemaining} days left! Consider saving $${dailySavings.toFixed(2)}/day to catch up.`,
				};
			} else {
				return {
					type: "neutral" as const,
					message: `Save $${weeklySavings.toFixed(2)} weekly to reach your goal by the deadline.`,
				};
			}
		}

		if (progress < 25) {
			return {
				type: "neutral" as const,
				message: "Keep building momentum! Every contribution counts.",
			};
		}

		return {
			type: "positive" as const,
			message: `Great progress! You're ${progress.toFixed(0)}% of the way there!`,
		};
	};

	const getNextMilestone = (goal: SavingsGoalModel) => {
		const progress = getProgress(goal);
		const nextMilestone = MILESTONES.find(m => progress < m.percentage);

		if (!nextMilestone) return null;

		const amountNeeded = (goal.target_amount * nextMilestone.percentage / 100) - goal.current_amount;
		return {
			...nextMilestone,
			amountNeeded,
		};
	};

	const getSortedAndFilteredGoals = () => {
		let filtered = goals;

		if (filterBy === "active") {
			filtered = goals.filter(g => !g.is_completed);
		} else if (filterBy === "completed") {
			filtered = goals.filter(g => g.is_completed);
		}

		return filtered.sort((a, b) => {
			if (sortBy === "deadline") {
				if (!a.deadline) return 1;
				if (!b.deadline) return -1;
				return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
			} else if (sortBy === "progress") {
				return getProgress(b) - getProgress(a);
			} else if (sortBy === "priority") {
				return b.priority_level - a.priority_level;
			}
			return 0;
		});
	};

	const getTotalSaved = () => {
		return goals.reduce((sum, goal) => sum + goal.current_amount, 0);
	};

	const getTotalTarget = () => {
		return goals.reduce((sum, goal) => sum + goal.target_amount, 0);
	};

	const getCompletedGoalsCount = () => {
		return goals.filter(g => g.is_completed).length;
	};

	const openEditDialog = (goal: SavingsGoalModel) => {
		setEditingGoal(goal);
		form.reset({
			goalName: goal.goal_name,
			targetAmount: goal.target_amount.toString(),
			currentAmount: goal.current_amount.toString(),
			deadline: goal.deadline || "",
			priorityLevel: goal.priority_level.toString(),
		});
		setDialogOpen(true);
	};

	const sortedGoals = getSortedAndFilteredGoals();

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Savings Goals</h2>
				<p className="text-zinc-600 mt-2">
					Set and track your financial goals to achieve your dreams
				</p>
			</div>

			{/* Main Goals Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Savings Goals</CardTitle>
							<CardDescription>Track your progress and achieve your dreams</CardDescription>
						</div>
						<Dialog open={dialogOpen} onOpenChange={(open) => {
							setDialogOpen(open);
							if (!open) {
								setEditingGoal(null);
								form.reset();
							}
						}}>
							<DialogTrigger asChild>
								<Button>
									<PlusCircle className="w-4 h-4 mr-2" />
									Create Goal
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
									<DialogDescription>
										{editingGoal ? "Update your savings goal" : "Set a new savings goal and start tracking"}
									</DialogDescription>
								</DialogHeader>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="goalName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Goal Name</FormLabel>
													<FormControl>
														<Input placeholder="New Car, Vacation, Emergency Fund..." {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="targetAmount"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Target Amount</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" placeholder="5000.00" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="currentAmount"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Current Amount</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" placeholder="0.00" {...field} />
													</FormControl>
													<FormDescription>How much have you saved so far?</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="deadline"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Target Date (Optional)</FormLabel>
													<FormControl>
														<Input type="date" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="priorityLevel"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Priority</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select priority" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="1">Low</SelectItem>
															<SelectItem value="2">Medium</SelectItem>
															<SelectItem value="3">High</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button type="submit" className="w-full">
											{editingGoal ? "Update Goal" : "Create Goal"}
										</Button>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading goals...</p>
					) : goals.length === 0 ? (
						<div className="text-center py-12">
							<Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">No savings goals yet</h3>
							<p className="text-muted-foreground mb-4">
								Start your savings journey by creating your first goal!
							</p>
							<Button onClick={() => setDialogOpen(true)}>
								<PlusCircle className="w-4 h-4 mr-2" />
								Create Your First Goal
							</Button>
						</div>
					) : (
						<div className="space-y-6">
							{/* Filters and Sorting */}
							<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
								<div className="flex gap-2">
									<Button
										variant={filterBy === "all" ? "default" : "outline"}
										size="sm"
										onClick={() => setFilterBy("all")}
									>
										All
									</Button>
									<Button
										variant={filterBy === "active" ? "default" : "outline"}
										size="sm"
										onClick={() => setFilterBy("active")}
									>
										Active
									</Button>
									<Button
										variant={filterBy === "completed" ? "default" : "outline"}
										size="sm"
										onClick={() => setFilterBy("completed")}
									>
										Completed
									</Button>
								</div>
								<Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Sort by" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="deadline">Deadline</SelectItem>
										<SelectItem value="progress">Progress</SelectItem>
										<SelectItem value="priority">Priority</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Separator />

							{/* Goals Grid */}
							<div className="grid gap-4 md:grid-cols-2">
								{sortedGoals.map((goal) => {
									const progress = getProgress(goal);
									const insight = getAIInsight(goal);
									const daysRemaining = getDaysRemaining(goal.deadline);
									const nextMilestone = getNextMilestone(goal);
									const isCompleted = goal.is_completed;

									return (
										<Card key={goal.id} className={isCompleted ? "border-green-200 bg-green-50/50" : ""}>
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-3">
														<div className={`p-2 rounded-lg ${isCompleted ? "bg-green-100" : "bg-zinc-100"}`}>
															<Target className={`w-5 h-5 ${isCompleted ? "text-green-600" : "text-zinc-600"}`} />
														</div>
														<div>
															<CardTitle className="text-lg flex items-center gap-2">
																{goal.goal_name}
																{isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
															</CardTitle>
															<div className="flex items-center gap-2 mt-1">
																<Badge variant="outline" className="text-xs">
																	{goal.priority_level === 3 ? "High" : goal.priority_level === 2 ? "Medium" : "Low"} Priority
																</Badge>
																{daysRemaining !== null && daysRemaining >= 0 && !isCompleted && (
																	<Badge variant="secondary" className="text-xs flex items-center gap-1">
																		<Clock className="w-3 h-3" />
																		{daysRemaining} days
																	</Badge>
																)}
															</div>
														</div>
													</div>
													<div className="flex items-center gap-1">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditDialog(goal)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleDeleteGoal(goal.id)}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Progress Bar */}
												<div className="space-y-2">
													<div className="flex justify-between items-center text-sm">
														<span className="font-medium">
															${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
														</span>
														<span className={`font-bold ${isCompleted ? "text-green-600" : ""}`}>
															{progress.toFixed(1)}%
														</span>
													</div>
													<Progress
														value={progress}
														className={isCompleted ? "bg-green-100" : ""}
													/>
													{!isCompleted && (
														<p className="text-xs text-muted-foreground">
															${(goal.target_amount - goal.current_amount).toFixed(2)} remaining
														</p>
													)}
												</div>

												{/* AI Insight */}
												{!isCompleted && (
													<div className={`p-3 rounded-lg flex items-start gap-2 ${
														insight.type === "success" ? "bg-green-50 border border-green-200" :
														insight.type === "positive" ? "bg-blue-50 border border-blue-200" :
														insight.type === "warning" ? "bg-amber-50 border border-amber-200" :
														"bg-zinc-50 border border-zinc-200"
													}`}>
														<Sparkles className={`w-4 h-4 mt-0.5 ${
															insight.type === "success" ? "text-green-600" :
															insight.type === "positive" ? "text-blue-600" :
															insight.type === "warning" ? "text-amber-600" :
															"text-zinc-600"
														}`} />
														<p className="text-xs flex-1">{insight.message}</p>
													</div>
												)}

												{/* Next Milestone */}
												{nextMilestone && !isCompleted && (
													<div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
														<div className="flex items-center gap-2 mb-1">
															<Trophy className="w-4 h-4 text-purple-600" />
															<span className="text-xs font-semibold text-purple-900">
																Next Milestone: {nextMilestone.label}
															</span>
														</div>
														<p className="text-xs text-purple-700">
															Save ${nextMilestone.amountNeeded.toFixed(2)} more to reach {nextMilestone.percentage}%
														</p>
													</div>
												)}

												{/* Add Contribution */}
												{!isCompleted && (
													<div className="pt-2 border-t">
														{selectedGoal?.id === goal.id ? (
															<div className="space-y-2">
																<Input
																	type="number"
																	step="0.01"
																	placeholder="Amount to add"
																	value={contributionAmount}
																	onChange={(e) => setContributionAmount(e.target.value)}
																/>
																<div className="flex gap-2">
																	<Button
																		size="sm"
																		onClick={() => handleAddContribution(goal)}
																		className="flex-1"
																	>
																		<ArrowUp className="w-4 h-4 mr-1" />
																		Add
																	</Button>
																	<Button
																		size="sm"
																		variant="outline"
																		onClick={() => {
																			setSelectedGoal(null);
																			setContributionAmount("");
																		}}
																	>
																		Cancel
																	</Button>
																</div>
															</div>
														) : (
															<Button
																size="sm"
																variant="outline"
																className="w-full"
																onClick={() => setSelectedGoal(goal)}
															>
																<DollarSign className="w-4 h-4 mr-2" />
																Add Contribution
															</Button>
														)}
													</div>
												)}

												{/* Completed Badge */}
												{isCompleted && (
													<div className="p-3 rounded-lg bg-green-100 border border-green-200 text-center">
														<Trophy className="w-6 h-6 text-green-600 mx-auto mb-1" />
														<p className="text-sm font-semibold text-green-900">
															Goal Achieved!
														</p>
														<p className="text-xs text-green-700">
															Congratulations on reaching your target!
														</p>
													</div>
												)}
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
						<CardTitle className="text-sm font-medium">Total Saved</CardTitle>
						<PiggyBank className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${getTotalSaved().toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">
							of ${getTotalTarget().toFixed(2)} target
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Goals</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{goals.length - getCompletedGoalsCount()}</div>
						<p className="text-xs text-muted-foreground">
							{getCompletedGoalsCount()} completed
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{getTotalTarget() > 0 ? ((getTotalSaved() / getTotalTarget()) * 100).toFixed(1) : 0}%
						</div>
						<Progress
							value={getTotalTarget() > 0 ? (getTotalSaved() / getTotalTarget()) * 100 : 0}
							className="mt-2"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
