import mongoose, { Schema, Document } from "mongoose";
import { IFavorite } from "./favorite.interface";

export interface FavoriteDocument extends Omit<IFavorite, "_id">, Document {}

const FavoriteSchema = new Schema<FavoriteDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Unique index to prevent duplicate favorites for same user and restaurant
FavoriteSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<FavoriteDocument>("Favorite", FavoriteSchema);
