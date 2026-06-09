import { Types } from "mongoose";

// OLD INTERFACE (commented out)
// export enum DealType {
//     TWO_FOR_ONE = "TWO_FOR_ONE",
//     FREE_ITEM = "FREE_ITEM",
//     PERCENT_DISCOUNT = "PERCENT_DISCOUNT",
//     FIXED_DISCOUNT = "FIXED_DISCOUNT",
// }

// export enum TwoForOneCategory {
//     MAIN_COURSE = "MAIN_COURSE",
//     DRINKS = "DRINKS",
//     DESSERTS = "DESSERTS",
//     STARTERS = "STARTERS",
// }

// export enum FreeItemBuy {
//     MAIN_COURSE = "MAIN_COURSE",
//     MENU = "MENU",
//     MAIN_COURSE_PLUS_DRINK = "MAIN_COURSE_PLUS_DRINK",
// }

// export enum FreeItemGet {
//     DRINK = "DRINK",
//     DESSERT = "DESSERT",
//     STARTER = "STARTER",
// }

// export enum PercentDiscountValue {
//     TEN = 10,
//     FIFTEEN = 15,
//     TWENTY = 20,
//     THIRTY = 30,
// }

// export enum PercentDiscountAppliesTo {
//     ENTIRE_ORDER = "ENTIRE_ORDER",
//     CATEGORY = "CATEGORY",
// }

// export enum PercentDiscountCategory {
//     MAIN_COURSE = "MAIN_COURSE",
//     MENU = "MENU",
//     DRINKS = "DRINKS",
// }

// export interface TwoForOneParams {
//     category: TwoForOneCategory;
// }

// export interface FreeItemParams {
//     buy: FreeItemBuy;
//     get: FreeItemGet;
// }

// export interface PercentDiscountParams {
//     percentage: PercentDiscountValue;
//     appliesTo: PercentDiscountAppliesTo;
//     category?: PercentDiscountCategory;
// }

// export interface FixedDiscountParams {
//     amount: number;
// }

// export interface IDeal {
//     _id?: string;
//     restaurant: Types.ObjectId;
//     type: DealType;
//     params: TwoForOneParams | FreeItemParams | PercentDiscountParams | FixedDiscountParams;
//     createdBy?: Types.ObjectId;
//     isActive: boolean;
//     isDeleted: boolean;
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// NEW INTERFACE (based on the commented code)
export enum DealType {
    TWO_FOR_ONE = "TWO_FOR_ONE",
    FREE_ITEM = "FREE_ITEM",
    PERCENT_DISCOUNT = "PERCENT_DISCOUNT",
    FIXED_DISCOUNT = "FIXED_DISCOUNT",
}

export enum TwoForOneCategory {
    MAIN_COURSE = "MAIN_COURSE",
    DRINKS = "DRINKS",
    DESSERTS = "DESSERTS",
    STARTERS = "STARTERS",
}

export enum FreeItemBuy {
    MAIN_COURSE = "MAIN_COURSE",
    MENU = "MENU",
    MAIN_COURSE_PLUS_DRINK = "MAIN_COURSE_PLUS_DRINK",
}

export enum FreeItemGet {
    DRINK = "DRINK",
    DESSERT = "DESSERT",
    STARTER = "STARTER",
}

export enum PercentDiscountAppliesTo {
    ENTIRE_ORDER = "ENTIRE_ORDER",
    CATEGORY = "CATEGORY",
}

export enum PercentDiscountCategory {
    MAIN_COURSE = "MAIN_COURSE",
    MENU = "MENU",
    DRINKS = "DRINKS",
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
    ALL_DAY = "ALL_DAY",
}

export interface IDeal {
    _id?: string | Types.ObjectId;
    restaurantId: Types.ObjectId;
    createdBy?: Types.ObjectId;
    dealType: DealType;
    title: string;
    description?: string;
    day: DayOfWeek;
    mealTime: MealTimeType;
    start?: string;
    end?: string;
    maxClaimsPerDay: number;
    isActive: boolean;
    isDeleted: boolean;
    twoForOne?: {
        appliesTo: TwoForOneCategory;
    };
    freeItem?: {
        buy: FreeItemBuy;
        get: FreeItemGet;
    };
    percentDiscount?: {
        percentage: 10 | 15 | 20 | 30;
        appliesTo: PercentDiscountAppliesTo;
        category?: PercentDiscountCategory;
    };
    fixedDiscount?: {
        amount: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
