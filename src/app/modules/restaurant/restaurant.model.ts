import mongoose, { Schema } from "mongoose";
import { IRestaurant, RestaurantType, CuisineType, DayOfWeek, MealTimeType } from "./resturant.interface";

export const DEFAULT_MEAL_TIMES = {
    [MealTimeType.LUNCH]: { openTime: "11:00", closeTime: "15:00" },
    [MealTimeType.DINNER]: { openTime: "17:00", closeTime: "22:00" },
};

const RestaurantOpenHourSlotSchema = new Schema({
    type: { type: String, enum: Object.values(MealTimeType), required: true },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
});

const RestaurantOpenHourSchema = new Schema({
    day: { type: String, enum: Object.values(DayOfWeek), required: true },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String },
    closeTime: { type: String },
    slots: { type: [RestaurantOpenHourSlotSchema], default: [] },
});

const RestaurantSchema = new Schema<IRestaurant>(
    {
        restaurantName: {
            type: String,
            required: [true, "Restaurant name is required"],
            trim: true,
        },
        restaurantDescription: {
            type: String,
            required: [true, "Restaurant description is required"],
            trim: true,
        },
        restaurantType: {
            type: String,
            enum: Object.values(RestaurantType),
            required: [true, "Restaurant type is required"],
        },
        cuisineType: {
            type: [String],
            enum: Object.values(CuisineType),
            required: [true, "Cuisine type is required"],
        },
        restaurantOwner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Restaurant owner is required"],
        },
        restaurantWebsite: {
            type: String,
            trim: true,
        },
        restaurantAddress: {
            street: { type: String, required: [true, "Street address is required"] },
            city: { type: String, required: [true, "City is required"] },
            state: { type: String, required: [true, "State is required"] },
            zipCode: { type: String, required: [true, "Zip code is required"] },
            country: { type: String, required: [true, "Country is required"] },
            location: {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point",
                },
                coordinates: {
                    type: [Number],
                    index: "2dsphere",
                },
            },
        },
        restaurantOpenHours: {
            type: [RestaurantOpenHourSchema],
            required: [true, "Restaurant open hours are required"],
        },
        restaurantImage: {
            type: String,
        },
        approved: {
            type: Boolean,
            default: false,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        approvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for faster lookups
RestaurantSchema.index({ restaurantOwner: 1 }, { unique: true });
RestaurantSchema.index({ restaurantName: 1 });
RestaurantSchema.index({ cuisineType: 1 });
RestaurantSchema.index({ restaurantType: 1 });
RestaurantSchema.index({ "restaurantAddress.location": "2dsphere" });

export const RestaurantModel = mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);

