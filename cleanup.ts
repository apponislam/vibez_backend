import mongoose from "mongoose";
import config from "./src/app/config";
import { UserModel } from "./src/app/modules/auth/auth.model";
import { CommissionModel } from "./src/app/modules/commission/commission.model";
import { UserSubscriptionModel } from "./src/app/modules/usersubscription/usersubscription.model";

async function cleanupData() {
    try {
        console.log("Connecting to Database using application config...");
        await mongoose.connect(config.mongodb_url as string);
        console.log("✅ Connected to Database");

        // 1. Delete all commission records
        const deletedCommissions = await CommissionModel.deleteMany({});
        console.log(`🗑️ Deleted ${deletedCommissions.deletedCount} Commission records.`);

        // 2. Delete all user subscription records
        const deletedSubscriptions = await UserSubscriptionModel.deleteMany({});
        console.log(`🗑️ Deleted ${deletedSubscriptions.deletedCount} UserSubscription records.`);

        // 3. Update existing users via UserModel
        const userUpdateResult = await UserModel.updateMany(
            {},
            {
                $set: {
                    balance: 0,
                    isNewUser: true,
                },
                $unset: {
                    subscriptionPlanId: "",
                    subscriptionEndDate: "",
                    stripeConnectedAccountId: "",
                },
            }
        );
        console.log(`✅ Updated ${userUpdateResult.modifiedCount} Users (balance: 0, isNewUser: true, subscription & stripe fields removed).`);

        console.log("🎉 Cleanup completed successfully!");
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanupData();
