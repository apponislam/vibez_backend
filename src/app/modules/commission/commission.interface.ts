import { Types } from "mongoose";

export interface ICommissionHistory {
    invoiceId: string;
    amount: number;
    createdAt: Date;
}

export interface ICommission {
    _id?: string;
    commissionPercentage: number;
    maxPayout: number;
    commissionDuration: number; // in months
    commissionPaidCount: number; // count of actual commission payments made
    commissionUser: Types.ObjectId; // User who got/earned the commission
    commissionFrom: Types.ObjectId; // User from whom the commission was generated
    subscriptionId: string; // Stripe subscription ID
    history: ICommissionHistory[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
