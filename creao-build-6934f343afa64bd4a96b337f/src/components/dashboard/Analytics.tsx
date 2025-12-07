import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsProps {
	userProfile: UserProfileModel;
}

export function Analytics({ userProfile }: AnalyticsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Spending Analytics</CardTitle>
				<CardDescription>Visualize your spending patterns and trends</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">Analytics and visualizations coming soon...</p>
			</CardContent>
		</Card>
	);
}
