import mongoose, { Schema, Document } from "mongoose";
import { IReview } from "./review.interface";

export interface ReviewDocument extends Omit<IReview, "_id">, Document {}

const ReviewSchema = new Schema<ReviewDocument>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
        images: {
            type: [String],
            default: [],
        },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ReviewSchema.index({ restaurantId: 1, isActive: 1 });

export const ReviewModel = mongoose.model<ReviewDocument>("Review", ReviewSchema);
