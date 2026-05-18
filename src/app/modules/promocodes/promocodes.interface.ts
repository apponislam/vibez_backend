import { Types } from "mongoose";

export interface PromoCode {
    _id?: string | Types.ObjectId;
    code: string;
    discountPercentage: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    usageLimit?: number;
    usageCount: number;
    restaurantId?: string | Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
