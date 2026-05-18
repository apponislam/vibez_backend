import mongoose, { Schema } from "mongoose";
import { PromoCode } from "./promocodes.interface";

const PromoCodeSchema = new Schema<PromoCode>(
    {
        code: {
            type: String,
            required: [true, "Promo code is required"],
            trim: true,
        },
        discountPercentage: {
            type: Number,
            required: [true, "Discount percentage is required"],
            min: 0,
            max: 100,
        },
        maxDiscountAmount: {
            type: Number,
            min: 0,
        },
        minOrderAmount: {
            type: Number,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        usageLimit: {
            type: Number,
            min: 0,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

PromoCodeSchema.index({ code: 1 }, { unique: true });
PromoCodeSchema.index({ restaurantId: 1 });
PromoCodeSchema.index({ isActive: 1 });

export const PromoCodeModel = mongoose.model<PromoCode>("PromoCode", PromoCodeSchema);
