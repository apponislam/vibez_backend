import { Types } from "mongoose";

export interface ISavedDeal {
    _id?: string | Types.ObjectId;
    userId: Types.ObjectId;
    dealId: Types.ObjectId;
    isUsed: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
