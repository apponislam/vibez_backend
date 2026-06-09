import { Types } from "mongoose";

export interface IShorts {
    _id?: string | Types.ObjectId;
    restaurantId: Types.ObjectId;
    shortUrl: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
