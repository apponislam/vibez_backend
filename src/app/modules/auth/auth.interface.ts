import { Types } from "mongoose";

export type UserRole = "ADMIN" | "RESTAURANT_OWNER" | "USER" | "STAFF";
export type StaffRole = "MANAGER" | "CASHIER" | "WAITER";

export interface User {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    staffRole?: StaffRole;
    restaurantId?: Types.ObjectId | null;
    phone?: string;
    profileImage?: string;
    location?: {
        lat?: number;
        lng?: number;
    };
    language?: string;
    aboutme?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    isActive: boolean;
    isEmailVerified: boolean;
    isDeleted: boolean;
    isInfluencer?: boolean;
    lastLogin?: Date;

    subscriptionPlanId?: Types.ObjectId | null;
    subscriptionEndDate?: Date;

    balance?: number;
    commissionPercentage?: number;
    maxPayout?: number;
    commissionDuration?: number;

    favoriteCuisines?: string[];
    dietaryPreferences?: string[];
    referralCode?: string;
    referredBy?: Types.ObjectId | null;
    stripeConnectedAccountId?: string;
    fcmTokens?: string[];

    // Password reset fields
    resetPasswordOtp?: string;
    resetPasswordOtpExpiry?: Date;
    resetPasswordToken?: string;
    resetPasswordTokenExpiry?: Date;

    // Email verification fields
    verificationToken?: string;
    verificationCode?: string;
    verificationExpiry?: Date;

    // Email update fields
    pendingEmail?: string;
    emailVerificationToken?: string;
    emailVerificationExpiry?: Date;

    // Staff specific settings
    enableStaffLogin?: boolean;

    createdAt: Date;
    updatedAt: Date;
}
