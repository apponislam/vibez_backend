import mongoose, { Schema, Document } from "mongoose";
import { ICommission } from "./commission.interface";

export interface CommissionDocument extends Omit<ICommission, "_id">, Document {}

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
            required: [true, "Commission duration is required"],
            min: [1, "Commission duration must be at least 1 day"],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Index strategy for faster queries
CommissionSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });

export const CommissionModel = mongoose.model<CommissionDocument>("Commission", CommissionSchema);
