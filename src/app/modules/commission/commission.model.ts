import mongoose, { Schema, Document } from "mongoose";
import { ICommission } from "./commission.interface";

export interface CommissionDocument extends Omit<ICommission, "_id">, Document {}

const CommissionHistorySchema = new Schema(
    {
        invoiceId: {
            type: String,
            required: [true, "Invoice ID is required"],
        },
        amount: {
            type: Number,
            required: [true, "Commission amount is required"],
            min: [0, "Commission amount cannot be negative"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const CommissionSchema = new Schema<CommissionDocument>(
    {
        commissionPercentage: {
            type: Number,
            required: [true, "Commission percentage is required"],
            min: [0, "Commission percentage cannot be negative"],
            max: [100, "Commission percentage cannot exceed 100"],
        },
        maxPayout: {
            type: Number,
            required: [true, "Maximum payout is required"],
            min: [0, "Maximum payout cannot be negative"],
        },
        commissionDuration: {
            type: Number,
            required: [true, "Commission duration in months is required"],
            min: [1, "Commission duration must be at least 1 month"],
        },
        commissionPaidCount: {
            type: Number,
            default: 0,
        },
        commissionUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Commission user (receiver) is required"],
        },
        commissionFrom: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Commission from (source user) is required"],
        },
        subscriptionId: {
            type: String,
            required: [true, "Stripe subscription ID is required"],
        },
        history: {
            type: [CommissionHistorySchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Index strategy for faster queries
CommissionSchema.index({ isActive: 1, createdAt: -1 });
CommissionSchema.index({ commissionUser: 1, isActive: 1 });
CommissionSchema.index({ commissionFrom: 1 });

export const CommissionModel = mongoose.model<CommissionDocument>("Commission", CommissionSchema);
