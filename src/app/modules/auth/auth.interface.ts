import { Types } from "mongoose";

export type UserRole = "ADMIN" | "RESTAURANT_OWNER" | "USER" | "STAFF";
export type StaffRole = "MANAGER" | "CASHIER" | "WAITER";

export interface User {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    staffRole?: StaffRole;
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

    approved: boolean;
    approvedBy?: Types.ObjectId | null;
    approvedAt?: Date;

    subscriptionPlanId?: Types.ObjectId | null;
    subscriptionEndDate?: Date;

    percentage?: number;
    balance?: number;

    favoriteCuisines?: string[];
    dietaryPreferences?: string[];
    referralCode?: string;
    referredBy?: Types.ObjectId | null;
    stripeConnectedAccountId?: string;

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

    createdAt: Date;
    updatedAt: Date;
}
