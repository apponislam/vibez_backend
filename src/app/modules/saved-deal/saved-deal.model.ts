import mongoose, { Schema, Document } from "mongoose";
import { ISavedDeal } from "./saved-deal.interface";

export interface SavedDealDocument extends Omit<ISavedDeal, "_id">, Document {}

const SavedDealSchema = new Schema<SavedDealDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dealId: {
            type: Schema.Types.ObjectId,
            ref: "Deal",
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Unique index to prevent duplicate saved deals for same user and deal
SavedDealSchema.index({ userId: 1, dealId: 1 }, { unique: true });

export const SavedDealModel = mongoose.model<SavedDealDocument>("SavedDeal", SavedDealSchema);
