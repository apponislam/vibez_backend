import { Types } from "mongoose";
import { UserSubscriptionStatus } from "../subscription/subscription.interface";

export interface IUserSubscription {
    _id?: Types.ObjectId | string;
    userId: Types.ObjectId;
    subscriptionPlanId: Types.ObjectId;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    status: UserSubscriptionStatus;
    startDate: Date;
    endDate: Date;
    isTrial: boolean;
    coupon?: string;
    
    // Commission details
    commissionAmount?: number;
    commissionUser?: Types.ObjectId;
}
