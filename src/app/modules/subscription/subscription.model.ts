import mongoose, { Schema } from "mongoose";
import { ISubscriptionPlan, SubscriptionDuration } from "./subscription.interface";

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        duration: {
            type: String,
            enum: Object.values(SubscriptionDuration),
            required: true,
        },
        isFreeTrial: { type: Boolean, default: false },
        freeTrialDays: { type: Number },
        stripeProductId: { type: String },
        stripePriceId: { type: String },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
