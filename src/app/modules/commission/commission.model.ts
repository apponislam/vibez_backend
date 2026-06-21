import mongoose, { Schema, Document } from "mongoose";
import { ICommission } from "./commission.interface";

export interface CommissionDocument extends Omit<ICommission, "_id">, Document {}

const CommissionGetByMonthSchema = new Schema(
    {
        count: {
            type: Number,
            required: [true, "Month count is required"],
        },
        commission: {
            type: Number,
            required: [true, "Commission amount is required"],
            min: [0, "Commission amount cannot be negative"],
        },
        time: {
            type: Date,
            required: [true, "Commission time is required"],
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
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        totalCount: {
            type: Number,
            default: 0,
        },
        commissionGetByMonth: {
            type: [CommissionGetByMonthSchema],
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
