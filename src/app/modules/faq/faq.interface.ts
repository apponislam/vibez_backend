import { Types } from "mongoose";

export interface IFAQ {
    _id?: string;

    question: string;
    answer: string;
    createdBy?: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

