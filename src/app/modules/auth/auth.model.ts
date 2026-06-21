import mongoose, { Schema } from "mongoose";
import { User } from "./auth.interface";
import crypto from "crypto";

const generateReferralCode = () => {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
};

const userSchemaDefinition: any = {
    subscriptionPlanId: {
        type: Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
    },
    subscriptionEndDate: {
        type: Date,
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },

    password: {
        type: String,
        required: [true, "Password is required"],
    },

    role: {
        type: String,
        enum: ["ADMIN", "RESTAURANT_OWNER", "USER", "STAFF"],
        default: "USER",
        required: true,
    },

    staffRole: {
        type: String,
        enum: ["MANAGER", "CASHIER", "WAITER"],
    },

    phone: {
        type: String,
    },

    profileImage: {
        type: String,
    },

    location: {
        lat: { type: Number },
        lng: { type: Number },
    },

    language: {
        type: String,
    },

    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    aboutme: {
        type: String,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    isEmailVerified: {
        type: Boolean,
        default: false,
    },

    isDeleted: {
        type: Boolean,
        default: false,
    },

    isInfluencer: {
        type: Boolean,
        default: false,
    },


    lastLogin: {
        type: Date,
    },



    balance: {
        type: Number,
        default: 0,
        min: 0,
    },



    favoriteCuisines: {
        type: [String],
        default: [],
    },

    dietaryPreferences: {
        type: [String],
        default: [],
    },

    referralCode: {
        type: String,
        unique: true,
        sparse: true,
    },

    referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    stripeConnectedAccountId: {
        type: String,
    },

    fcmTokens: {
        type: [String],
        default: [],
    },

    resetPasswordOtp: String,
    resetPasswordOtpExpiry: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,

    verificationToken: String,
    verificationCode: String,
    verificationExpiry: Date,

    pendingEmail: String,
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
};

const UserSchema = new Schema<User>(userSchemaDefinition, {
    timestamps: true,
    versionKey: false,

    toJSON: {
        transform(doc, ret: Partial<User>) {
            delete ret.password;
            delete ret.resetPasswordOtp;
            delete ret.resetPasswordOtpExpiry;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordTokenExpiry;
            delete ret.verificationToken;
            delete ret.verificationCode;
            delete ret.verificationExpiry;
            delete ret.emailVerificationToken;
            delete ret.emailVerificationExpiry;
            delete ret.pendingEmail;
            return ret;
        },
    },
});

UserSchema.pre("save", async function () {
    const self = this as any;
    if (!self.referralCode) {
        let code: string;
        let isUnique = false;
        while (!isUnique) {
            code = generateReferralCode();
            const existing = await (this.constructor as any).findOne({ referralCode: code });
            if (!existing) {
                self.referralCode = code;
                isUnique = true;
            }
        }
    }
});

/*
|--------------------------------------------------------------------------
| Index Strategy (Production Safe)
|--------------------------------------------------------------------------
*/

// Authentication lookup
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ name: 1 });

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

UserSchema.index({ isEmailVerified: 1 });

// Token lookup indexes (important for auth flows)
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ emailVerificationToken: 1 });

// Activity tracking optimization
UserSchema.index({ lastLogin: -1 });

export const UserModel = mongoose.model<User>("User", UserSchema);
