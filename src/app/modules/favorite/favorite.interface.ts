import { Types } from "mongoose";

export interface IFavorite {
    _id?: string | Types.ObjectId;
    userId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
