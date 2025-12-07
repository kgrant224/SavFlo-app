import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { TransactionORM, TransactionCategory } from "@/components/data/orm/orm_transaction";
import type { TransactionModel } from "@/components/data/orm/orm_transaction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const transactionSchema = z.object({
	amount: z.string().min(1, "Amount is required"),
	category: z.string().min(1, "Category is required"),
	description: z.string().optional(),
	transactionTime: z.string().min(1, "Date is required"),
	isRecurring: z.boolean().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionManagerProps {
	userProfile: UserProfileModel;
}

export function TransactionManager({ userProfile }: TransactionManagerProps) {
	const [transactions, setTransactions] = useState<TransactionModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);

	const form = useForm<TransactionFormData>({
		resolver: zodResolver(transactionSchema),
		defaultValues: {
			amount: "",
			category: "",
			description: "",
			transactionTime: new Date().toISOString().split("T")[0],
			isRecurring: false,
		},
	});

	useEffect(() => {
		loadTransactions();
	}, []);

	const loadTransactions = async () => {
		try {
			const orm = TransactionORM.getInstance();
			const txs = await orm.getAllTransaction();
			setTransactions(txs.sort((a, b) => b.transaction_time.localeCompare(a.transaction_time)));
		} catch (error) {
			console.error("Error loading transactions:", error);
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: TransactionFormData) => {
		try {
			const orm = TransactionORM.getInstance();

			const newTransaction: Partial<TransactionModel> = {
				user_id: userProfile.id,
				amount: parseFloat(data.amount),
				category: parseInt(data.category) as TransactionCategory,
				description: data.description || null,
				transaction_time: data.transactionTime,
				is_recurring: data.isRecurring,
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
			};

			await orm.insertTransaction([newTransaction as TransactionModel]);
			toast.success("Transaction added successfully");
			form.reset();
			setDialogOpen(false);
			await loadTransactions();
		} catch (error) {
			console.error("Error adding transaction:", error);
			toast.error("Failed to add transaction");
		}
	};

	const handleDelete = async (id: string) => {
		try {
			const orm = TransactionORM.getInstance();
			await orm.deleteTransactionById(id);
			toast.success("Transaction deleted");
			await loadTransactions();
		} catch (error) {
			console.error("Error deleting transaction:", error);
			toast.error("Failed to delete transaction");
		}
	};

	const getCategoryColor = (category: TransactionCategory) => {
		const colors: Record<number, string> = {
			[TransactionCategory.Food]: "bg-orange-100 text-orange-800",
			[TransactionCategory.Entertainment]: "bg-purple-100 text-purple-800",
			[TransactionCategory.Transportation]: "bg-blue-100 text-blue-800",
			[TransactionCategory.Utilities]: "bg-green-100 text-green-800",
			[TransactionCategory.Shopping]: "bg-pink-100 text-pink-800",
			[TransactionCategory.Health]: "bg-red-100 text-red-800",
			[TransactionCategory.Subscriptions]: "bg-indigo-100 text-indigo-800",
			[TransactionCategory.Other]: "bg-gray-100 text-gray-800",
		};
		return colors[category] || colors[TransactionCategory.Other];
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Transactions</h2>
				<p className="text-zinc-600 mt-2">
					Track and manage all your spending in one place
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Transaction History</CardTitle>
							<CardDescription>Track and manage your spending</CardDescription>
						</div>
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button>
									<PlusCircle className="w-4 h-4 mr-2" />
									Add Transaction
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add New Transaction</DialogTitle>
									<DialogDescription>Record a new transaction</DialogDescription>
								</DialogHeader>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<FormField
											control={form.control}
											name="amount"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Amount</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" placeholder="50.00" {...field} />
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
															<SelectItem value={String(TransactionCategory.Food)}>Food</SelectItem>
															<SelectItem value={String(TransactionCategory.Entertainment)}>Entertainment</SelectItem>
															<SelectItem value={String(TransactionCategory.Transportation)}>Transportation</SelectItem>
															<SelectItem value={String(TransactionCategory.Utilities)}>Utilities</SelectItem>
															<SelectItem value={String(TransactionCategory.Shopping)}>Shopping</SelectItem>
															<SelectItem value={String(TransactionCategory.Health)}>Health</SelectItem>
															<SelectItem value={String(TransactionCategory.Subscriptions)}>Subscriptions</SelectItem>
															<SelectItem value={String(TransactionCategory.Other)}>Other</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Description (Optional)</FormLabel>
													<FormControl>
														<Input placeholder="Grocery shopping at Walmart" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="transactionTime"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Date</FormLabel>
													<FormControl>
														<Input type="date" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button type="submit" className="w-full">Add Transaction</Button>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading transactions...</p>
					) : transactions.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">No transactions yet. Add your first transaction above!</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Category</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((tx) => (
									<TableRow key={tx.id}>
										<TableCell>{new Date(tx.transaction_time).toLocaleDateString()}</TableCell>
										<TableCell>{tx.description || "—"}</TableCell>
										<TableCell>
											<Badge className={getCategoryColor(tx.category)}>
												{TransactionCategory[tx.category]}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-medium">${tx.amount.toFixed(2)}</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(tx.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
