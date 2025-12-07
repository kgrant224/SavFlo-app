import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { BudgetORM } from "@/components/data/orm/orm_budget";
import type { BudgetModel } from "@/components/data/orm/orm_budget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const budgetSchema = z.object({
	categoryName: z.string().min(1, "Category name is required"),
	monthlyLimit: z.string().min(1, "Monthly limit is required"),
	alertThreshold: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetTrackerProps {
	userProfile: UserProfileModel;
}

export function BudgetTracker({ userProfile }: BudgetTrackerProps) {
	const [budgets, setBudgets] = useState<BudgetModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);

	const form = useForm<BudgetFormData>({
		resolver: zodResolver(budgetSchema),
		defaultValues: {
			categoryName: "",
			monthlyLimit: "",
			alertThreshold: "80",
		},
	});

	useEffect(() => {
		loadBudgets();
	}, []);

	const loadBudgets = async () => {
		try {
			const orm = BudgetORM.getInstance();
			const buds = await orm.getAllBudget();
			setBudgets(buds.filter(b => b.is_active));
		} catch (error) {
			console.error("Error loading budgets:", error);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: BudgetFormData) => {
		try {
			const orm = BudgetORM.getInstance();

			const newBudget: Partial<BudgetModel> = {
				user_id: userProfile.id,
				category_name: data.categoryName,
				monthly_limit: parseFloat(data.monthlyLimit),
				current_spent: 0,
				alert_threshold: data.alertThreshold ? parseFloat(data.alertThreshold) : 80,
				is_active: true,
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
			};

			await orm.insertBudget([newBudget as BudgetModel]);
			toast.success("Budget created successfully");
			form.reset();
			setDialogOpen(false);
			await loadBudgets();
		} catch (error) {
			console.error("Error creating budget:", error);
			toast.error("Failed to create budget");
		}
	};

	const getBudgetStatus = (budget: BudgetModel) => {
		const percentage = (budget.current_spent / budget.monthly_limit) * 100;
		if (percentage >= budget.alert_threshold) return "warning";
		if (percentage >= 100) return "exceeded";
		return "ok";
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Budgets</h2>
				<p className="text-zinc-600 mt-2">
					Set and monitor spending limits for different categories
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Budget Tracker</CardTitle>
							<CardDescription>Manage your category budgets</CardDescription>
						</div>
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button>
									<PlusCircle className="w-4 h-4 mr-2" />
									Create Budget
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Create New Budget</DialogTitle>
									<DialogDescription>Set a spending limit for a category</DialogDescription>
								</DialogHeader>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="categoryName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Category Name</FormLabel>
													<FormControl>
														<Input placeholder="Food, Entertainment, etc." {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="monthlyLimit"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Monthly Limit</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" placeholder="500.00" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="alertThreshold"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Alert Threshold (%)</FormLabel>
													<FormControl>
														<Input type="number" placeholder="80" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button type="submit" className="w-full">Create Budget</Button>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading budgets...</p>
					) : budgets.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">No budgets yet. Create your first budget above!</p>
					) : (
						<div className="space-y-4">
							{budgets.map((budget) => {
								const percentage = (budget.current_spent / budget.monthly_limit) * 100;
								const status = getBudgetStatus(budget);

								return (
									<Card key={budget.id}>
										<CardHeader className="pb-3">
											<div className="flex items-center justify-between">
												<CardTitle className="text-lg">{budget.category_name}</CardTitle>
												{status === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
												{status === "exceeded" && <AlertTriangle className="w-5 h-5 text-red-500" />}
											</div>
										</CardHeader>
										<CardContent className="space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">
													${budget.current_spent.toFixed(2)} of ${budget.monthly_limit.toFixed(2)}
												</span>
												<span className={percentage >= 100 ? "text-red-600 font-medium" : "text-muted-foreground"}>
													{percentage.toFixed(1)}%
												</span>
											</div>
											<Progress
												value={Math.min(percentage, 100)}
												className={percentage >= budget.alert_threshold ? "bg-red-100" : ""}
											/>
											<p className="text-xs text-muted-foreground">
												${(budget.monthly_limit - budget.current_spent).toFixed(2)} remaining
											</p>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
