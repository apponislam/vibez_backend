import cron from "node-cron";
import { UserModel } from "../app/modules/auth/auth.model";
import { UserSubscriptionModel } from "../app/modules/usersubscription/usersubscription.model";
import { UserSubscriptionStatus } from "../app/modules/subscription/subscription.interface";
import { ReservationModel } from "../app/modules/reservation/reservation.model";
import { ReservationStatus } from "../app/modules/reservation/reservation.interface";
import { SavedDealModel } from "../app/modules/saved-deal/saved-deal.model";

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

const startReservationAutoCompleteCron = () => {
    // Run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        try {
            const now = new Date();

            // Find UPCOMING or ARRIVED reservations where reservationDate + reservationTime + 1 hour <= now
            const reservations = await ReservationModel.find({
                status: { $in: [ReservationStatus.UPCOMING, ReservationStatus.ARRIVED] },
            });

            let completedCount = 0;

            for (const reservation of reservations) {
                // Build full datetime from reservationDate + reservationTime (e.g. "18:30")
                const [hours, minutes] = reservation.reservationTime.split(":").map(Number);
                const reservationDateTime = new Date(reservation.reservationDate);
                reservationDateTime.setHours(hours, minutes, 0, 0);

                // Add 1 hour
                const completionTime = new Date(reservationDateTime.getTime() + 60 * 60 * 1000);

                if (now >= completionTime) {
                    reservation.status = ReservationStatus.COMPLETED;
                    await reservation.save();

                    // If a deal was associated with the reservation, mark the saved deal as used
                    if (reservation.dealId) {
                        await SavedDealModel.updateOne(
                            {
                                userId: reservation.userId,
                                dealId: reservation.dealId,
                            },
                            {
                                $set: { isUsed: true },
                            }
                        );
                    }

                    completedCount++;
                }
            }

            if (completedCount > 0) {
                console.log(`[CRON] Auto-completed ${completedCount} reservations.`);
            }
        } catch (error) {
            console.error("[CRON] Error during reservation auto-complete:", error);
        }
    });
};

export const cronJobs = {
    startSubscriptionExpiryCron,
    startReservationAutoCompleteCron,
};

