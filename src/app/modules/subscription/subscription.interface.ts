import { Types } from "mongoose";

export enum SubscriptionDuration {
    MONTHLY = "MONTHLY",
    HALF_YEARLY = "HALF_YEARLY",
    YEARLY = "YEARLY",
    TWO_YEARLY = "TWO_YEARLY",
}

export enum UserSubscriptionStatus {
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
}

export interface ISubscriptionPlan {
    _id?: Types.ObjectId | string;
    name: string;
    price: number;
    duration: SubscriptionDuration;
    isFreeTrial: boolean;
    freeTrialDays?: number;
    stripeProductId?: string;
    stripePriceId?: string;
}
