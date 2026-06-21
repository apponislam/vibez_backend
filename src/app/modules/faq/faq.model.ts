import mongoose, { Schema, Document } from "mongoose";
import { IFAQ } from "./faq.interface";

export interface FAQDocument extends Omit<IFAQ, "_id">, Document {}

const FAQSchema = new Schema<FAQDocument>(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for faster lookups
FAQSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });

export const FAQModel = mongoose.model<FAQDocument>("FAQ", FAQSchema);


