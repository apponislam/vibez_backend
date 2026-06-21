import cron from "node-cron";
import { UserModel } from "../app/modules/auth/auth.model";
import { UserSubscriptionModel } from "../app/modules/usersubscription/usersubscription.model";
import { UserSubscriptionStatus } from "../app/modules/subscription/subscription.interface";

const startSubscriptionExpiryCron = () => {
    // Run every 24 hours (at midnight)
    cron.schedule("0 0 * * *", async () => {
        console.log("[CRON] Checking and updating expired subscriptions...");
        try {
            const now = new Date();

            // 1. Update status of expired subscriptions in the UserSubscription collection
            const expiredSubs = await UserSubscriptionModel.updateMany(
                {
                    endDate: { $lt: now },
                    status: { $in: [UserSubscriptionStatus.ACTIVE, UserSubscriptionStatus.CANCELLED] },
                },
                {
                    $set: { status: UserSubscriptionStatus.EXPIRED },
                },
            );

            // 2. Clear subscription info fields on the User model
            const updatedUsers = await UserModel.updateMany(
                {
                    subscriptionEndDate: { $lt: now },
                },
                {
                    $set: {
                        subscriptionPlanId: null,
                        subscriptionEndDate: null,
                    },
                },
            );

            console.log(`[CRON] Subscription expiry check completed. Expired subscriptions: ${expiredSubs.modifiedCount}, Users updated: ${updatedUsers.modifiedCount}`);
        } catch (error) {
            console.error("[CRON] Error during subscription expiry execution:", error);
        }
    });
};

export const cronJobs = {
    startSubscriptionExpiryCron,
};
