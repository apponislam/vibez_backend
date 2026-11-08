import { Types } from "mongoose";

export interface ICoupon {
    _id?: Types.ObjectId | string;
    couponId: string; // The Stripe coupon ID
    name?: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: "once" | "repeating" | "forever";
    durationInMonths?: number;
    isDefault: boolean; // Indicates if this is a default coupon for referrals
    selectedPlans?: (Types.ObjectId | string)[]; // Specific SubscriptionPlan IDs this coupon is restricted to (works for both direct-use and default referral coupons)
    isActive: boolean;
    maxRedemptions?: number;
    timesRedeemed: number;
    isDirectUse: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
