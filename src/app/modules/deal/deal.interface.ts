import { Types } from "mongoose";

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

export enum PercentDiscountValue {
    TEN = 10,
    FIFTEEN = 15,
    TWENTY = 20,
    THIRTY = 30,
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

export interface TwoForOneParams {
    category: TwoForOneCategory;
}

export interface FreeItemParams {
    buy: FreeItemBuy;
    get: FreeItemGet;
}

export interface PercentDiscountParams {
    percentage: PercentDiscountValue;
    appliesTo: PercentDiscountAppliesTo;
    category?: PercentDiscountCategory;
}

export interface FixedDiscountParams {
    amount: number;
}

export interface IDeal {
    _id?: string;
    restaurant: Types.ObjectId;
    type: DealType;
    params: TwoForOneParams | FreeItemParams | PercentDiscountParams | FixedDiscountParams;
    createdBy?: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// import { Types } from "mongoose";

// export type DealType = "TWO_FOR_ONE" | "FREE_ITEM" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT";

// export type TwoForOneCategory = "MAIN_COURSE" | "DRINKS" | "DESSERTS" | "STARTERS";

// export type FreeItemBuy = "MAIN_COURSE" | "MENU" | "MAIN_COURSE_PLUS_DRINK";

// export type FreeItemGet = "DRINK" | "DESSERT" | "STARTER";

// export type PercentDiscountAppliesTo = "ENTIRE_ORDER" | "CATEGORY";

// export type PercentDiscountCategory = "MAIN_COURSE" | "MENU" | "DRINKS";

// export interface Deal {
//     _id?: string | Types.ObjectId;
//     restaurantId: Types.ObjectId;
//     dealType: DealType;
//     title: string;
//     description?: string;
//     startDate: Date;
//     endDate: Date;
//     isActive: boolean;
//     twoForOne?: {
//         appliesTo: TwoForOneCategory;
//     };
//     freeItem?: {
//         buy: FreeItemBuy;
//         get: FreeItemGet;
//     };
//     percentDiscount?: {
//         percentage: 10 | 15 | 20 | 30;
//         appliesTo: PercentDiscountAppliesTo;
//         category?: PercentDiscountCategory;
//     };
//     fixedDiscount?: {
//         amount: number;
//     };
//     createdAt?: Date;
//     updatedAt?: Date;
// }
