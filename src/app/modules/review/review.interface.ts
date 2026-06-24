import { Types } from "mongoose";

export interface IReview {
    _id?: string | Types.ObjectId;
    restaurantId: Types.ObjectId;
    userId: Types.ObjectId;
    rating: number;
    comment?: string;
    reservationId?: Types.ObjectId;
    images?: string[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
