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
        coupon: { type: String },
        commissionAmount: { type: Number },
        commissionUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for faster lookups
UserSubscriptionSchema.index({ userId: 1, status: 1 });
UserSubscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true, sparse: true });
UserSubscriptionSchema.index({ subscriptionPlanId: 1 });
UserSubscriptionSchema.index({ commissionUser: 1 });

export const UserSubscriptionModel = mongoose.model<IUserSubscription>(
    "UserSubscription",
    UserSubscriptionSchema
);

