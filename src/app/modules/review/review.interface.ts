import { Types } from "mongoose";

export interface IReview {
    _id?: string | Types.ObjectId;
    restaurantId: Types.ObjectId;
    userId: Types.ObjectId;
    rating: number; // 1-5
    comment?: string;
    images?: string[]; // Array of image filenames
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
