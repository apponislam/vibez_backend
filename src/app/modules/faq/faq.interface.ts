import { Types } from "mongoose";

export enum FAQAudienceEnum {
    STUDENT = "student",
    TEACHER = "teacher",
}

export interface IFAQ {
    _id?: string;

    question: string;
    answer: string;
    audience: FAQAudienceEnum;
    createdBy?: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
