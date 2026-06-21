import { Types } from "mongoose";

export interface ISettings {
    _id?: Types.ObjectId | string;
    defaultMaxPayout: number;
    defaultCommisionPercentage: number;
    defaultCommissionDuration: number; // in months
    emailNotification: boolean;
    pushNotification: boolean;
    allowAutoApproveNewResturant: boolean;
    allowAutoApproveResturantDeals: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
