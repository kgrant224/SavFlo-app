import { useEffect, useState, useMemo } from "react";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { TransactionORM, TransactionCategory } from "@/components/data/orm/orm_transaction";
import type { TransactionModel } from "@/components/data/orm/orm_transaction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
	LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
	TrendingUp, TrendingDown, DollarSign, Calendar,
	AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek,
	startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO, isSameDay } from "date-fns";

interface SpendingAnalyticsProps {
	userProfile: UserProfileModel;
}

type TimeFilter = "weekly" | "monthly" | "quarterly" | "yearly";

const CATEGORY_COLORS: Record<number, string> = {
	[TransactionCategory.Food]: "#ef4444",
	[TransactionCategory.Entertainment]: "#8b5cf6",
	[TransactionCategory.Transportation]: "#3b82f6",
	[TransactionCategory.Utilities]: "#f59e0b",
	[TransactionCategory.Shopping]: "#ec4899",
	[TransactionCategory.Health]: "#10b981",
	[TransactionCategory.Subscriptions]: "#6366f1",
	[TransactionCategory.Other]: "#6b7280",
	[TransactionCategory.Unspecified]: "#9ca3af",
};

const CATEGORY_NAMES: Record<number, string> = {
	[TransactionCategory.Food]: "Food",
	[TransactionCategory.Entertainment]: "Entertainment",
	[TransactionCategory.Transportation]: "Transportation",
	[TransactionCategory.Utilities]: "Utilities",
	[TransactionCategory.Shopping]: "Shopping",
	[TransactionCategory.Health]: "Health",
	[TransactionCategory.Subscriptions]: "Subscriptions",
	[TransactionCategory.Other]: "Other",
	[TransactionCategory.Unspecified]: "Unspecified",
};

export function SpendingAnalytics({ userProfile }: SpendingAnalyticsProps) {
	const [transactions, setTransactions] = useState<TransactionModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

	useEffect(() => {
		loadTransactions();
	}, []);

	const loadTransactions = async () => {
		try {
			const orm = TransactionORM.getInstance();
			const txs = await orm.getAllTransaction();
			setTransactions(txs);
		} catch (error) {
			console.error("Error loading transactions:", error);
		} finally {
			setLoading(false);
		}
	};

	// Get date range based on filter
	const dateRange = useMemo(() => {
		const now = new Date();
		switch (timeFilter) {
			case "weekly":
				return { start: startOfWeek(now), end: endOfWeek(now) };
			case "monthly":
				return { start: startOfMonth(now), end: endOfMonth(now) };
			case "quarterly":
				return { start: startOfQuarter(now), end: endOfQuarter(now) };
			case "yearly":
				return { start: startOfYear(now), end: endOfYear(now) };
		}
	}, [timeFilter]);

	// Filter transactions by date range
	const filteredTransactions = useMemo(() => {
		return transactions.filter((tx) => {
			const txDate = parseISO(tx.transaction_time);
			return txDate >= dateRange.start && txDate <= dateRange.end;
		});
	}, [transactions, dateRange]);

	// Calculate previous period transactions
	const previousPeriodTransactions = useMemo(() => {
		const now = new Date();
		let prevStart: Date, prevEnd: Date;

		switch (timeFilter) {
			case "weekly":
				prevEnd = new Date(dateRange.start);
				prevEnd.setDate(prevEnd.getDate() - 1);
				prevStart = startOfWeek(prevEnd);
				break;
			case "monthly":
				const prevMonth = subMonths(now, 1);
				prevStart = startOfMonth(prevMonth);
				prevEnd = endOfMonth(prevMonth);
				break;
			case "quarterly":
				prevEnd = new Date(dateRange.start);
				prevEnd.setDate(prevEnd.getDate() - 1);
				prevStart = startOfQuarter(prevEnd);
				break;
			case "yearly":
				const prevYear = new Date(now);
				prevYear.setFullYear(prevYear.getFullYear() - 1);
				prevStart = startOfYear(prevYear);
				prevEnd = endOfYear(prevYear);
				break;
		}

		return transactions.filter((tx) => {
			const txDate = parseISO(tx.transaction_time);
			return txDate >= prevStart && txDate <= prevEnd;
		});
	}, [transactions, dateRange, timeFilter]);

	// Calculate total spending
	const totalSpending = useMemo(() => {
		return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
	}, [filteredTransactions]);

	const previousTotalSpending = useMemo(() => {
		return previousPeriodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
	}, [previousPeriodTransactions]);

	// Calculate change percentage
	const changePercentage = useMemo(() => {
		if (previousTotalSpending === 0) return totalSpending > 0 ? 100 : 0;
		return ((totalSpending - previousTotalSpending) / previousTotalSpending) * 100;
	}, [totalSpending, previousTotalSpending]);

	// Category breakdown
	const categoryData = useMemo(() => {
		const categoryTotals: Record<number, number> = {};
		filteredTransactions.forEach((tx) => {
			categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
		});

		return Object.entries(categoryTotals)
			.map(([category, amount]) => ({
				name: CATEGORY_NAMES[Number.parseInt(category)],
				value: amount,
				color: CATEGORY_COLORS[Number.parseInt(category)],
				percentage: (amount / totalSpending) * 100,
			}))
			.sort((a, b) => b.value - a.value);
	}, [filteredTransactions, totalSpending]);

	// Previous period category data for comparison
	const previousCategoryData = useMemo(() => {
		const categoryTotals: Record<number, number> = {};
		previousPeriodTransactions.forEach((tx) => {
			categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
		});
		return categoryTotals;
	}, [previousPeriodTransactions]);

	// Trend data (daily/weekly/monthly based on filter)
	const trendData = useMemo(() => {
		const groupedData: Record<string, number> = {};

		filteredTransactions.forEach((tx) => {
			const txDate = parseISO(tx.transaction_time);
			let key: string;

			switch (timeFilter) {
				case "weekly":
					key = format(txDate, "EEE"); // Mon, Tue, etc.
					break;
				case "monthly":
					key = format(txDate, "MMM d"); // Dec 1, Dec 2, etc.
					break;
				case "quarterly":
				case "yearly":
					key = format(txDate, "MMM"); // Jan, Feb, etc.
					break;
			}

			groupedData[key] = (groupedData[key] || 0) + tx.amount;
		});

		return Object.entries(groupedData).map(([date, amount]) => ({
			date,
			amount,
		}));
	}, [filteredTransactions, timeFilter]);

	// Weekly spending pattern (compare weekend vs weekday)
	const weekendVsWeekday = useMemo(() => {
		let weekendTotal = 0;
		let weekdayTotal = 0;

		filteredTransactions.forEach((tx) => {
			const txDate = parseISO(tx.transaction_time);
			const dayOfWeek = txDate.getDay();
			if (dayOfWeek === 0 || dayOfWeek === 6) {
				weekendTotal += tx.amount;
			} else {
				weekdayTotal += tx.amount;
			}
		});

		return { weekend: weekendTotal, weekday: weekdayTotal };
	}, [filteredTransactions]);

	// Generate behavioral insights
	const insights = useMemo(() => {
		const insightList: string[] = [];

		// Weekend spending insight
		if (weekendVsWeekday.weekend > weekendVsWeekday.weekday * 0.4) {
			const percentHigher = Math.round((weekendVsWeekday.weekend / (weekendVsWeekday.weekday / 5 * 2)) * 100 - 100);
			insightList.push(`Your weekend spending is ${percentHigher}% higher than weekdays.`);
		}

		// Category increase insights
		categoryData.forEach((category) => {
			const categoryKey = Object.keys(CATEGORY_NAMES).find(
				(key) => CATEGORY_NAMES[Number.parseInt(key)] === category.name
			);
			if (categoryKey) {
				const prevAmount = previousCategoryData[Number.parseInt(categoryKey)] || 0;
				if (prevAmount > 0) {
					const increase = ((category.value - prevAmount) / prevAmount) * 100;
					if (increase > 15) {
						insightList.push(
							`${category.name} spending is ${Math.round(increase)}% higher than the previous period.`
						);
					}
				}
			}
		});

		// First week spending pattern (for monthly view)
		if (timeFilter === "monthly") {
			const firstWeekSpending = filteredTransactions
				.filter((tx) => {
					const txDate = parseISO(tx.transaction_time);
					return txDate.getDate() <= 7;
				})
				.reduce((sum, tx) => sum + tx.amount, 0);

			if (firstWeekSpending > totalSpending * 0.35) {
				insightList.push("You tend to spend more during the first week of the month.");
			}
		}

		// Add encouraging insights if spending is down
		if (changePercentage < -5) {
			insightList.push(`Great job! You've reduced spending by ${Math.abs(Math.round(changePercentage))}% this period.`);
		}

		return insightList;
	}, [categoryData, previousCategoryData, weekendVsWeekday, filteredTransactions, totalSpending, timeFilter, changePercentage]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4" />
					<p className="text-zinc-600">Loading your analytics...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div>
				<h2 className="text-3xl font-bold text-zinc-900">Spending Analytics</h2>
				<p className="text-zinc-600 mt-2">
					Get a clear, visual understanding of your spending habits and patterns
				</p>
			</div>

			{/* Time Filter */}
			<div className="flex justify-end">
				<Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
					<TabsList>
						<TabsTrigger value="weekly">Weekly</TabsTrigger>
						<TabsTrigger value="monthly">Monthly</TabsTrigger>
						<TabsTrigger value="quarterly">Quarterly</TabsTrigger>
						<TabsTrigger value="yearly">Yearly</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Dashboard Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Spending</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${totalSpending.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d, yyyy")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">vs Previous Period</CardTitle>
						{changePercentage >= 0 ? (
							<TrendingUp className="h-4 w-4 text-red-500" />
						) : (
							<TrendingDown className="h-4 w-4 text-green-500" />
						)}
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<div className="text-2xl font-bold">
								{changePercentage >= 0 ? "+" : ""}
								{changePercentage.toFixed(1)}%
							</div>
							{changePercentage >= 0 ? (
								<ArrowUpRight className="h-5 w-5 text-red-500" />
							) : (
								<ArrowDownRight className="h-5 w-5 text-green-500" />
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							${Math.abs(totalSpending - previousTotalSpending).toFixed(2)} difference
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Transactions</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{filteredTransactions.length}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Avg ${filteredTransactions.length > 0 ? (totalSpending / filteredTransactions.length).toFixed(2) : "0.00"} per
							transaction
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Section */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Trend Line Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Spending Trend</CardTitle>
						<CardDescription>Track your spending over time</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={trendData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
								<Legend />
								<Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Amount" />
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Category Pie Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Category Breakdown</CardTitle>
						<CardDescription>See where your money goes</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={categoryData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={(entry) => `${entry.name}: ${entry.percentage.toFixed(0)}%`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{categoryData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Weekly Bar Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Daily Breakdown</CardTitle>
						<CardDescription>Compare spending across days</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={trendData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
								<Legend />
								<Bar dataKey="amount" fill="#8b5cf6" name="Amount" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Top Categories */}
				<Card>
					<CardHeader>
						<CardTitle>Top Spending Categories</CardTitle>
						<CardDescription>Your biggest expense areas</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{categoryData.slice(0, 5).map((category, index) => {
								const categoryKey = Object.keys(CATEGORY_NAMES).find(
									(key) => CATEGORY_NAMES[Number.parseInt(key)] === category.name
								);
								const prevAmount = categoryKey ? previousCategoryData[Number.parseInt(categoryKey)] || 0 : 0;
								const change = prevAmount > 0 ? ((category.value - prevAmount) / prevAmount) * 100 : 0;

								return (
									<div key={index} className="flex items-center justify-between">
										<div className="flex items-center gap-3 flex-1">
											<div
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: category.color }}
											/>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium">{category.name}</p>
													{Math.abs(change) > 10 && (
														<Badge variant={change > 0 ? "destructive" : "default"} className="text-xs">
															{change > 0 ? "+" : ""}
															{change.toFixed(0)}%
														</Badge>
													)}
												</div>
												<div className="w-full bg-zinc-200 rounded-full h-2 mt-1">
													<div
														className="h-2 rounded-full"
														style={{
															width: `${category.percentage}%`,
															backgroundColor: category.color,
														}}
													/>
												</div>
											</div>
										</div>
										<div className="text-sm font-semibold ml-4">${category.value.toFixed(2)}</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Behavioral Insights */}
			{insights.length > 0 && (
				<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Sparkles className="w-5 h-5 text-blue-600" />
							<CardTitle className="text-blue-900">AI Insights</CardTitle>
						</div>
						<CardDescription className="text-blue-700">
							Smart patterns detected in your spending behavior
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{insights.map((insight, index) => (
								<div key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-100">
									<AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
									<p className="text-sm text-zinc-700">{insight}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
