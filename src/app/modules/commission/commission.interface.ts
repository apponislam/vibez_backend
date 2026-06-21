import { Types } from "mongoose";

export interface ICommission {
    _id?: string;
    commissionPercentage: number;
    maxPayout: number;
    commissionDuration: number; // in days
    createdBy?: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
