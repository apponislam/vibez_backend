import { Types } from "mongoose";

export enum WithdrawStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export enum WithdrawPaymentMethod {
    STRIPE = "STRIPE",
    BANK = "BANK",
}

export interface IWithdraw {
    _id?: Types.ObjectId | string;
    userId: Types.ObjectId;
    amount: number;
    status: WithdrawStatus;
    paymentMethod: WithdrawPaymentMethod;
    paymentDetails?: Record<string, any>;
    adminFeedback?: string;
    stripeTransferId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
