import mongoose, { Schema, Document } from "mongoose";
import { IDeal, DealType, TwoForOneCategory, FreeItemBuy, FreeItemGet, PercentDiscountAppliesTo, PercentDiscountCategory, DayOfWeek, MealTimeType } from "./deal.interface";

export interface DealDocument extends Omit<IDeal, "_id">, Document {}

const DEFAULT_DEAL_TIMES = {
    [MealTimeType.LUNCH]: { start: "11:00", end: "15:00" },
    [MealTimeType.DINNER]: { start: "17:00", end: "22:00" },
};

const DealSchema = new Schema<DealDocument>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        dealType: {
            type: String,
            enum: Object.values(DealType),
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        day: {
            type: [String],
            enum: Object.values(DayOfWeek),
            required: true,
        },
        mealTime: {
            type: String,
            enum: Object.values(MealTimeType),
            required: true,
        },
        resturantHours: {
            type: [
                {
                    day: {
                        type: String,
                        enum: Object.values(DayOfWeek),
                        required: true,
                    },
                    start: {
                        type: String,
                    },
                    end: {
                        type: String,
                    },
                },
            ],
            required: true,
        },
        maxClaimsPerDay: {
            type: Number,
            required: [true, "Max claims per day is required"],
            min: 1,
        },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        twoForOne: {
            appliesTo: {
                type: String,
                enum: Object.values(TwoForOneCategory),
            },
        },
        freeItem: {
            buy: {
                type: String,
                enum: Object.values(FreeItemBuy),
            },
            get: {
                type: String,
                enum: Object.values(FreeItemGet),
            },
        },
        percentDiscount: {
            percentage: {
                type: Number,
                enum: [10, 15, 20, 30],
            },
            appliesTo: {
                type: String,
                enum: Object.values(PercentDiscountAppliesTo),
            },
            category: {
                type: String,
                enum: Object.values(PercentDiscountCategory),
            },
        },
        fixedDiscount: {
            minSpend: { type: Number, default: 0 },
            amount: { type: Number },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

DealSchema.pre("save", function () {
    const doc = this as any;
    if (doc.resturantHours && Array.isArray(doc.resturantHours)) {
        doc.resturantHours.forEach((hour: any) => {
            if (!hour.start || !hour.end) {
                const defaults = DEFAULT_DEAL_TIMES[doc.mealTime as MealTimeType];
                if (defaults) {
                    hour.start = hour.start || defaults.start;
                    hour.end = hour.end || defaults.end;
                }
            }
        });
    }
});

// Indexes for faster lookups
DealSchema.index({ restaurantId: 1, isDeleted: 1, isActive: 1, createdAt: -1 });
DealSchema.index({ isDeleted: 1, isActive: 1 });

export const DealModel = mongoose.model<DealDocument>("Deal", DealSchema);

