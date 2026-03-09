import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

/**
 * POST /api/auth/onboarding-complete
 * Sets publicMetadata.onboardingCompleted = true on the current Clerk user.
 * This persists across all devices/browsers so the tutorial only shows once.
 */
export async function POST() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                ...user.publicMetadata,
                onboardingCompleted: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to set onboarding metadata:", error);
        return NextResponse.json(
            { error: "Failed to update onboarding status" },
            { status: 500 }
        );
    }
}
