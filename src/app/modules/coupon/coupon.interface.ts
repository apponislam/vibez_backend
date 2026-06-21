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
    isActive: boolean;
    maxRedemptions?: number;
    timesRedeemed: number;
    createdAt?: Date;
    updatedAt?: Date;
}
