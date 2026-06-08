import { Types } from "mongoose";

export enum RestaurantType {
    RESTAURANT = "RESTAURANT",
    CAFE = "CAFE",
    NIGHT_CLUB = "NIGHT_CLUB",
    STREET_FOOD = "STREET_FOOD",
    BAKERY = "BAKERY",
    FINE_DINING = "FINE_DINING",
}

export enum CuisineType {
    ITALIAN = "ITALIAN",
    CHINESE = "CHINESE",
    JAPANESE = "JAPANESE",
    INDIAN = "INDIAN",
    THAI = "THAI",
    FAST_FOOD = "FAST_FOOD",
    BBQ = "BBQ",
    SEAFOOD = "SEAFOOD",
    VEGAN = "VEGAN",
    DESSERTS = "DESSERTS",
    COFFEE_BAKERY = "COFFEE_BAKERY",
    FINE_DINING = "FINE_DINING",
    LOCAL_FOOD = "LOCAL_FOOD",
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
    BREAKFAST = "BREAKFAST",
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
    cuisineType: CuisineType;
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
}
