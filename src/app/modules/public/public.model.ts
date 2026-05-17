import mongoose, { Schema, Document } from "mongoose";
import { IPolicy, PolicyTypeEnum } from "./public.interface";

export interface PolicyDocument extends IPolicy, Document {}

const PolicySchema = new Schema<PolicyDocument>(
    {
        type: {
            type: String,
            enum: Object.values(PolicyTypeEnum),
            required: true,
            unique: true,
        },
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        publishedAt: { type: Date },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const PolicyModel = mongoose.model<PolicyDocument>("Policy", PolicySchema);
