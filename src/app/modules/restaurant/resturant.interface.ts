import { Types } from "mongoose";

export enum RestaurantType {
    RESTAURANT = "RESTAURANT",
    BAR = "BAR",
    BISTRO = "BISTRO",
    CAFE = "CAFE",
    BAKERY = "BAKERY",
}

export enum CuisineType {
    AMERICAN = "AMERICAN",
    ITALIAN = "ITALIAN",
    SWISS_CUISINE = "SWISS_CUISINE",
    INDIAN = "INDIAN",
    CHINESE = "CHINESE",
    THAI = "THAI",
    VIETNAMESE = "VIETNAMESE",
    TURKISH = "TURKISH",
    MEXICAN = "MEXICAN",
}

export enum FoodType {
    PIZZA = "PIZZA",
    BURGER = "BURGER",
    SUSHI = "SUSHI",
    PASTA = "PASTA",
    MEAT = "MEAT",
    FISH = "FISH",
    SEAFOOD = "SEAFOOD",
    KEBAB = "KEBAB",
    VEGAN = "VEGAN",
    VEGETARIAN = "VEGETARIAN",
}

export enum DayOfWeek {
    MONDAY = "MONDAY",
    TUESDAY = "TUESDAY",
    WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY",
    FRIDAY = "FRIDAY",
    SATURDAY = "SATURDAY",
    SUNDAY = "SUNDAY",
}

export enum MealTimeType {
    LUNCH = "LUNCH",
    DINNER = "DINNER",
}

export interface RestaurantOpenHourSlot {
    type: MealTimeType;
    openTime: string;
    closeTime: string;
}

export interface RestaurantOpenHour {
    day: DayOfWeek;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    slots?: RestaurantOpenHourSlot[];
}

export interface IRestaurant {
    restaurantName: string;
    restaurantDescription: string;
    restaurantType: RestaurantType;
    cuisineType: CuisineType[];
    foodType?: FoodType[];
    restaurantOwner: Types.ObjectId;
    restaurantWebsite: string;
    restaurantAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;

        // NEW: Geo location
        location?: {
            type: "Point";
            coordinates: [number, number]; // [lng, lat]
        };
    };
    restaurantOpenHours: RestaurantOpenHour[];
    restaurantImage?: string;
    restaurantImages?: string[];
    approved: boolean;
    approvedBy?: Types.ObjectId | null;
    approvedAt?: Date;
}
