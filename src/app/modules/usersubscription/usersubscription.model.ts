import mongoose, { Schema } from "mongoose";
import { IUserSubscription } from "./usersubscription.interface";
import { UserSubscriptionStatus } from "../subscription/subscription.interface";

const UserSubscriptionSchema = new Schema<IUserSubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subscriptionPlanId: {
            type: Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: true,
        },
        stripeSubscriptionId: { type: String },
        stripeCustomerId: { type: String },
        status: {
            type: String,
            enum: Object.values(UserSubscriptionStatus),
            default: UserSubscriptionStatus.ACTIVE,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isTrial: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const UserSubscriptionModel = mongoose.model<IUserSubscription>(
    "UserSubscription",
    UserSubscriptionSchema
);
