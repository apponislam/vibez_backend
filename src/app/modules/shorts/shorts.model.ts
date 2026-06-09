import mongoose, { Schema, Document } from "mongoose";
import { IShorts } from "./shorts.interface";

export interface ShortsDocument extends Omit<IShorts, "_id">, Document {}

const ShortsSchema = new Schema<ShortsDocument>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            unique: true, // Only one short per restaurant
        },
        shortUrl: {
            type: String,
            required: true,
        },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ShortsSchema.index({ restaurantId: 1, isActive: 1 });

export const ShortsModel = mongoose.model<ShortsDocument>("Shorts", ShortsSchema);
