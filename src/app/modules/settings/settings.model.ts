import mongoose, { Schema, Document } from "mongoose";
import { ISettings } from "./settings.interface";

export interface SettingsDocument extends Omit<ISettings, "_id">, Document {}

const SettingsSchema = new Schema<SettingsDocument>(
    {
        defaultMaxPayout: {
            type: Number,
            required: true,
            default: 100,
        },
        defaultCommisionPercentage: {
            type: Number,
            required: true,
            default: 10,
        },
        defaultCommissionDuration: {
            type: Number,
            required: true,
            default: 12, // in months
        },
        emailNotification: {
            type: Boolean,
            required: true,
            default: true,
        },
        pushNotification: {
            type: Boolean,
            required: true,
            default: true,
        },
        allowAutoApproveNewResturant: {
            type: Boolean,
            required: true,
            default: false,
        },
        allowAutoApproveResturantDeals: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const SettingsModel = mongoose.model<SettingsDocument>("Settings", SettingsSchema);
