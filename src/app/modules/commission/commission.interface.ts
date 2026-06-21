import { Types } from "mongoose";

export interface ICommissionGetByMonth {
    count: number;      // which month count (1, 2, 3...)
    commission: number; // how much commission got
    time: Date;         // which time
}

export interface ICommission {
    _id?: string;
    commissionPercentage: number;
    maxPayout: number;
    commissionDuration: number; // in months
    commissionUser: Types.ObjectId; // User who got/earned the commission
    commissionFrom: Types.ObjectId; // User from whom the commission was generated
    startDate: Date; // Start date of the commission period
    endDate: Date;   // End date of the commission period
    totalCount: number; // top level total count (total number of commission payments/months)
    commissionGetByMonth: ICommissionGetByMonth[]; // single array of monthly commissions
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
