import { Types } from "mongoose";

export interface IShorts {
    _id?: string | Types.ObjectId;
    restaurantId: Types.ObjectId;
    shortUrl: string;
    isActive: boolean;
    shareCount: number;
    saveCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}
