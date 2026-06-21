import mongoose, { Schema } from "mongoose";
import { ICoupon } from "./coupon.interface";

const CouponSchema = new Schema<ICoupon>(
    {
        couponId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            trim: true,
        },
        percentOff: {
            type: Number,
            min: 0,
            max: 100,
        },
        amountOff: {
            type: Number,
            min: 0,
        },
        currency: {
            type: String,
            default: "chf",
        },
        duration: {
            type: String,
            enum: ["once", "repeating", "forever"],
            required: true,
        },
        durationInMonths: {
            type: Number,
            min: 1,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        maxRedemptions: {
            type: Number,
            min: 1,
        },
        timesRedeemed: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const CouponModel = mongoose.model<ICoupon>("Coupon", CouponSchema);
