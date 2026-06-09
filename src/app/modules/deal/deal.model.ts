import mongoose, { Schema, Document } from "mongoose";
import { IDeal, DealType, TwoForOneCategory, FreeItemBuy, FreeItemGet, PercentDiscountValue, PercentDiscountAppliesTo, PercentDiscountCategory } from "./deal.interface";

export interface DealDocument extends Omit<IDeal, "_id">, Document {}

const DealSchema = new Schema<DealDocument>(
    {
        restaurant: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(DealType),
            required: true,
        },
        params: {
            type: Schema.Types.Mixed,
            required: true,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

DealSchema.index({ restaurant: 1, isActive: 1 });

export const DealModel = mongoose.model<DealDocument>("Deal", DealSchema);
