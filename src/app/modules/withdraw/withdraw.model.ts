import mongoose, { Schema } from "mongoose";
import { IWithdraw, WithdrawStatus, WithdrawPaymentMethod } from "./withdraw.interface";

const WithdrawSchema = new Schema<IWithdraw>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, "Amount must be at least 1"],
        },
        status: {
            type: String,
            enum: Object.values(WithdrawStatus),
            default: WithdrawStatus.PENDING,
        },
        paymentMethod: {
            type: String,
            enum: Object.values(WithdrawPaymentMethod),
            required: true,
        },
        paymentDetails: {
            type: Schema.Types.Mixed,
            default: {},
        },
        adminFeedback: {
            type: String,
            trim: true,
        },
        stripeTransferId: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for faster lookups
WithdrawSchema.index({ userId: 1, createdAt: -1 });
WithdrawSchema.index({ status: 1 });
WithdrawSchema.index({ stripeTransferId: 1 }, { unique: true, sparse: true });

export const WithdrawModel = mongoose.model<IWithdraw>("Withdraw", WithdrawSchema);

