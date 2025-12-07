import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserProfileORM, UserProfileAccountTier } from "@/components/data/orm/orm_user_profile";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { toast } from "sonner";
import { Wallet, TrendingUp, Target } from "lucide-react";

const onboardingSchema = z.object({
	monthlyIncome: z.string().min(1, "Monthly income is required"),
	financialHabits: z.string().optional(),
	savingsTarget: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFlowProps {
	onComplete: (profile: UserProfileModel) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<OnboardingFormData>({
		resolver: zodResolver(onboardingSchema),
		defaultValues: {
			monthlyIncome: "",
			financialHabits: "",
			savingsTarget: "",
		},
	});

	const onSubmit = async (data: OnboardingFormData) => {
		setIsLoading(true);
		try {
			const orm = UserProfileORM.getInstance();

			const newProfile: Partial<UserProfileModel> = {
				monthly_income: parseFloat(data.monthlyIncome),
				financial_habits: data.financialHabits || null,
				savings_target: data.savingsTarget ? parseFloat(data.savingsTarget) : null,
				account_tier: UserProfileAccountTier.Free,
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
			};

			const created = await orm.insertUserProfile([newProfile as UserProfileModel]);

			if (created.length > 0) {
				toast.success("Welcome! Your financial journey begins now.");
				onComplete(created[0]);
			}
		} catch (error) {
			console.error("Error creating profile:", error);
			toast.error("Failed to create profile. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl shadow-lg">
				<CardHeader className="text-center space-y-2">
					<div className="mx-auto w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
						<Wallet className="w-8 h-8 text-white" />
					</div>
					<CardTitle className="text-3xl font-bold">Welcome to Your Financial Coach</CardTitle>
					<CardDescription className="text-base">
						Let's get started by understanding your financial situation
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<FormField
								control={form.control}
								name="monthlyIncome"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<TrendingUp className="w-4 h-4" />
											Monthly Income
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="5000.00"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="savingsTarget"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Target className="w-4 h-4" />
											Initial Savings Target (Optional)
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="10000.00"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="financialHabits"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tell us about your financial habits (Optional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="e.g., I tend to overspend on dining out, want to save for a house, struggle with impulse purchases..."
												className="min-h-24"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								size="lg"
								disabled={isLoading}
							>
								{isLoading ? "Setting up your account..." : "Start Your Financial Journey"}
							</Button>
						</form>
					</Form>

					<div className="mt-6 space-y-4">
						<div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
							<h4 className="font-semibold mb-2 text-sm">Free Features:</h4>
							<ul className="text-sm text-zinc-600 space-y-1">
								<li>✓ Manual spending tracking</li>
								<li>✓ Basic category summaries</li>
								<li>✓ Daily spending log</li>
								<li>✓ 1 weekly report</li>
							</ul>
						</div>
						<div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-300">
							<h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
								Premium Features
								<span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">$9.99/mo</span>
							</h4>
							<ul className="text-sm text-amber-900 space-y-1">
								<li>✨ AI daily financial coach</li>
								<li>✨ Predictive spending alerts</li>
								<li>✨ Personalized saving plans</li>
								<li>✨ Unlimited smart alerts</li>
								<li>✨ AI Money Patterns Report</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
