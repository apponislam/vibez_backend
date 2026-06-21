import mongoose, { Schema } from "mongoose";
import { ISubscriptionPlan, SubscriptionDuration } from "./subscription.interface";

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
        duration: {
            type: String,
            enum: Object.values(SubscriptionDuration),
            required: true,
        },
        isFreeTrial: { type: Boolean, default: false },
        freeTrialDays: { type: Number },
        stripeProductId: { type: String, trim: true },
        stripePriceId: { type: String, trim: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for faster lookups
SubscriptionPlanSchema.index({ name: 1 }, { unique: true });
SubscriptionPlanSchema.index({ stripePriceId: 1 }, { unique: true, sparse: true });
SubscriptionPlanSchema.index({ stripeProductId: 1 }, { unique: true, sparse: true });

export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);

