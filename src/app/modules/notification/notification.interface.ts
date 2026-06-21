import { Types } from "mongoose";

export interface INotification {
    _id?: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
