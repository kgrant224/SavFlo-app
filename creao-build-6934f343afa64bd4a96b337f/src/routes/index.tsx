import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Dashboard } from "@/components/Dashboard";
import { UserProfileORM } from "@/components/data/orm/orm_user_profile";
import type { UserProfileModel } from "@/components/data/orm/orm_user_profile";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const [userProfile, setUserProfile] = useState<UserProfileModel | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkUserProfile();
	}, []);

	const checkUserProfile = async () => {
		try {
			const orm = UserProfileORM.getInstance();
			const profiles = await orm.getAllUserProfile();

			if (profiles.length > 0) {
				setUserProfile(profiles[0]);
			}
		} catch (error) {
			console.error("Error loading user profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOnboardingComplete = (profile: UserProfileModel) => {
		setUserProfile(profile);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4" />
					<p className="text-zinc-600">Loading your financial coach...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			{!userProfile ? (
				<OnboardingFlow onComplete={handleOnboardingComplete} />
			) : (
				<Dashboard userProfile={userProfile} onProfileUpdate={setUserProfile} />
			)}
			<Toaster />
		</>
	);
}
