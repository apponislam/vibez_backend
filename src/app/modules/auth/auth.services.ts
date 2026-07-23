import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { jwtHelper } from "../../../utils/jwtHelper";
import config from "../../config";
import { UserModel } from "./auth.model";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendOtpEmail, sendVerificationEmail, sendWelcomeEmail, sendEmailUpdateVerification } from "../../../utils/emailTemplates";
import mongoose from "mongoose";
import { RestaurantModel } from "../restaurant/restaurant.model";
import { SettingsModel } from "../settings/settings.model";
import { getLatLngFromAddress } from "../../../utils/googleMaps";

const registerUser = async (data: any) => {
    // Check existing user
    const existing = await UserModel.findOne({ email: data.email });
    if (existing) throw new ApiError(httpStatus.BAD_REQUEST, "Email already registered. Please sign in.");

    // Remove balance if sent in payload to prevent manual setting
    if (data.balance !== undefined) {
        delete data.balance;
    }

    // Resolve referral/referredBy if provided
    let referredBy = null;
    const referralCodeInput = data.referredByCode || data.referralCode;
    if (data.referredBy && mongoose.Types.ObjectId.isValid(data.referredBy)) {
        referredBy = data.referredBy;
    } else if (referralCodeInput) {
        const referrer = await UserModel.findOne({ referralCode: referralCodeInput });
        if (referrer) {
            referredBy = referrer._id;
        }
    }

    // Remove these fields so they don't interfere with the new user's database document fields
    delete data.referralCode;
    delete data.referredByCode;
    delete data.referredBy;

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, Number(config.bcrypt_salt_rounds));

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Fetch Settings for defaults
    const settings = await SettingsModel.findOne();
    const defaultCommisionPercentage = settings ? settings.defaultCommisionPercentage : 10;
    const defaultMaxPayout = settings ? settings.defaultMaxPayout : 100;
    const defaultCommissionDuration = settings ? settings.defaultCommissionDuration : 12;

    // Create user
    const userData = {
        ...data,
        password: hashedPassword,
        isActive: true,
        isEmailVerified: false,
        balance: 0,
        referredBy,
        verificationToken,
        verificationCode,
        verificationExpiry,
        commissionPercentage: data.commissionPercentage !== undefined ? data.commissionPercentage : defaultCommisionPercentage,
        maxPayout: data.maxPayout !== undefined ? data.maxPayout : defaultMaxPayout,
        commissionDuration: data.commissionDuration !== undefined ? data.commissionDuration : defaultCommissionDuration,
    };

    const createdUser = await UserModel.create(userData);

    sendVerificationEmail(createdUser.email as string, createdUser.name as string, verificationCode);
    sendWelcomeEmail(createdUser.email as string, createdUser.name as string);

    // Generate tokens
    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const userObject = createdUser.toObject();
    const { password: pwd, verificationToken: vToken, verificationExpiry: vExpiry, verificationCode: vCode, ...userWithoutSensitive } = userObject;

    return { user: userWithoutSensitive, accessToken, refreshToken };
};

const loginUser = async (data: { email: string; password: string }) => {
    // Find user
    const user = await UserModel.findOne({ email: data.email }).populate("subscriptionPlanId");
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");

    // Check if active
    if (!user.isActive) {
        throw new ApiError(
            httpStatus.FORBIDDEN,
            "Your account has been deactivated. Please contact support for assistance."
        );
    }

    // Check if staff login is enabled
    if (user.role === "STAFF" && user.enableStaffLogin === false) {
        throw new ApiError(
            httpStatus.FORBIDDEN,
            "Staff login is disabled by the restaurant owner. Please contact your manager."
        );
    }

    // Update last login
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Generate tokens
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, accessToken, refreshToken };
};

const verifyEmail = async (email: string, token?: string, otp?: string) => {
    const user = await UserModel.findOne({
        email,
        verificationExpiry: { $gt: new Date() },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
    }

    if (token) {
        if (user.verificationToken !== token) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Verification token is invalid or expired");
        }
    } else if (otp) {
        if (user.verificationCode !== otp) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Verification code (OTP) is invalid or expired");
        }
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Token or OTP is required");
    }

    // Mark email verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    await user.save();

    return { message: "Email verified successfully" };
};

const resendVerificationEmail = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    if (user.isEmailVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already verified");
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationCode = verificationCode;
    user.verificationExpiry = verificationExpiry;
    await user.save();

    // Send verification email
    sendVerificationEmail(user.email as string, user.name as string, verificationCode);

    return { message: "Verification email sent" };
};

const getUserById = async (userId: string) => {
    const user = await UserModel.findById(userId).select("-password").populate("subscriptionPlanId");
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
    return user;
};

const refreshAccessToken = async (refreshToken: string) => {
    if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token required");

    try {
        const decoded = jwtHelper.verifyToken(refreshToken, config.jwt_refresh_secret as string);

        const user = await UserModel.findById(decoded._id).select("-password").populate("subscriptionPlanId");
        if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User not registered");

        const jwtPayload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

        return { user, accessToken };
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }
};

const requestPasswordReset = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    sendOtpEmail(email, otp, user.name as string);

    return { message: "OTP sent" };
};

const verifyOtp = async (email: string, otp: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No OTP request found");
    }

    if (user.resetPasswordOtpExpiry < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
    }

    if (user.resetPasswordOtp !== otp) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Clear OTP
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    await user.save();

    return { token: resetToken };
};

const resendOtp = async (email: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    // Send email
    sendOtpEmail(email, otp, user.name as string);

    return { message: "OTP resent" };
};

const resetPassword = async (token: string, newPassword: string) => {
    const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "The password reset link is invalid or has expired. Please try again.");

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;

    await user.save();
};

const updateProfile = async (userId: string, data: any) => {
    // Prevent manual balance update
    if (data.balance !== undefined) {
        delete data.balance;
    }

    // Resolve referral/referredBy if provided and not already referred
    const referralCodeInput = data.referredByCode || data.referralCode;
    if (referralCodeInput || data.referredBy) {
        const currentUser = await UserModel.findById(userId);
        if (currentUser && !currentUser.referredBy) {
            if (data.referredBy && mongoose.Types.ObjectId.isValid(data.referredBy)) {
                // Keep data.referredBy if valid
            } else if (referralCodeInput) {
                const referrer = await UserModel.findOne({ referralCode: referralCodeInput });
                if (referrer && referrer._id.toString() !== userId) {
                    data.referredBy = referrer._id;
                } else {
                    delete data.referredBy;
                }
            }
        } else {
            // Already has a referrer, do not allow changing it
            delete data.referredBy;
        }
    }
    delete data.referredByCode;
    delete data.referralCode;

    const user = await UserModel.findByIdAndUpdate(userId, { $set: data }, { returnDocument: "after", runValidators: true }).select("-password").populate("subscriptionPlanId");

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
    return user;
};

const addFcmToken = async (userId: string, token: string) => {
    if (!token) throw new ApiError(httpStatus.BAD_REQUEST, "FCM token is required");

    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    // Initialize if undefined
    if (!user.fcmTokens) {
        user.fcmTokens = [];
    }

    // Filter out if it already exists, then push to the end so it's marked as the newest/most recently active
    user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
    user.fcmTokens.push(token);

    // Keep only the newest 10 tokens
    if (user.fcmTokens.length > 10) {
        user.fcmTokens = user.fcmTokens.slice(-10);
    }

    await user.save();
    return user;
};

const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect current password");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const updateEmail = async (userId: string, newEmail: string, password: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");

    const existingUser = await UserModel.findOne({ email: newEmail });
    if (existingUser) throw new ApiError(httpStatus.BAD_REQUEST, "Email is already registered");

    // Generate verification token for new email
    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.pendingEmail = newEmail;
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    // Send verification email
    const verificationUrl = `${config.client_url}/verify-new-email?token=${verificationToken}&email=${newEmail}`;
    sendEmailUpdateVerification(newEmail, user.name as string, verificationUrl);
};

const resendEmailUpdate = async (userId: string, password: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    if (!user.pendingEmail) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No pending email update");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect");

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = verificationExpiry;
    await user.save();

    // Send verification email
    const verificationUrl = `${config.client_url}/verify-new-email?token=${verificationToken}&email=${user.pendingEmail}`;
    sendEmailUpdateVerification(user.pendingEmail as string, user.name as string, verificationUrl);

    return { message: "Verification email resent" };
};

const verifyNewEmail = async (token: string, email: string) => {
    const user = await UserModel.findOne({
        pendingEmail: email,
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "The email verification link is invalid or has expired. Please try again.");

    // Update email
    user.email = email;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    await user.save();

    return { message: "New email verified successfully" };
};

const setUserPassword = async (userId: string, newPassword: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    user.password = hashedPassword;
    await user.save();
};

const updateLocation = async (userId: string, lat: number, lng: number) => {
    const user = await UserModel.findByIdAndUpdate(userId, { $set: { location: { lat, lng } } }, { returnDocument: "after", runValidators: true }).select("-password");

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
    return user;
};

const registerRestaurant = async (data: any) => {
    // Check existing user
    const existing = await UserModel.findOne({ email: data.email });
    if (existing) throw new ApiError(httpStatus.BAD_REQUEST, "Email already registered. Please sign in.");

    // Remove balance if sent in payload to prevent manual setting
    if (data.balance !== undefined) {
        delete data.balance;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, Number(config.bcrypt_salt_rounds));

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Resolve referral/referredBy if provided
    let referredBy = null;
    const referralCodeInput = data.referredByCode || data.referralCode;
    if (data.referredBy && mongoose.Types.ObjectId.isValid(data.referredBy)) {
        referredBy = data.referredBy;
    } else if (referralCodeInput) {
        const referrer = await UserModel.findOne({ referralCode: referralCodeInput });
        if (referrer) {
            referredBy = referrer._id;
        }
    }

    // Fetch settings for defaults
    const settings = await SettingsModel.findOne();
    const defaultCommisionPercentage = settings ? settings.defaultCommisionPercentage : 10;
    const defaultMaxPayout = settings ? settings.defaultMaxPayout : 100;
    const defaultCommissionDuration = settings ? settings.defaultCommissionDuration : 12;
    const autoApprove = settings ? settings.allowAutoApproveNewResturant : false;

    // Prepare User Data
    const userData = {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "RESTAURANT_OWNER" as const,
        phone: data.phone,
        profileImage: data.profileImage,
        location: data.location,
        address: data.address,
        isActive: true,
        isEmailVerified: false,
        balance: 0,
        referredBy,
        verificationToken,
        verificationCode,
        verificationExpiry,
        commissionPercentage: data.commissionPercentage !== undefined ? data.commissionPercentage : defaultCommisionPercentage,
        maxPayout: data.maxPayout !== undefined ? data.maxPayout : defaultMaxPayout,
        commissionDuration: data.commissionDuration !== undefined ? data.commissionDuration : defaultCommissionDuration,
    };

    // Parse Address and Open Hours if they are strings
    let address = data.restaurantAddress;
    if (typeof address === "string") {
        try {
            address = JSON.parse(address);
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid restaurant address format");
        }
    }

    let openHours = data.restaurantOpenHours;
    if (typeof openHours === "string") {
        try {
            openHours = JSON.parse(openHours);
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid restaurant open hours format");
        }
    }

    // Resolve lat/lng from address components using Google Maps API
    if (address) {
        const latVal = address.lat;
        const lngVal = address.lng !== undefined ? address.lng : address.lan;

        if (latVal !== undefined && lngVal !== undefined && latVal !== "" && lngVal !== "") {
            const lat = parseFloat(latVal);
            const lng = parseFloat(lngVal);
            address.lat = lat.toString();
            address.lng = lng.toString();
            address.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        } else {
            const coords = await getLatLngFromAddress(address, data.restaurantName);
            if (coords) {
                address.lat = coords.lat.toString();
                address.lng = coords.lng.toString();
                address.location = {
                    type: "Point",
                    coordinates: [coords.lng, coords.lat],
                };
            }
        }
    }


    let cuisineType = data.cuisineType;
    if (typeof cuisineType === "string") {
        try {
            cuisineType = JSON.parse(cuisineType);
        } catch (error) {
            cuisineType = cuisineType.split(",").map((c: string) => c.trim().toUpperCase());
        }
    }

    let foodType = data.foodType;
    if (foodType) {
        if (typeof foodType === "string") {
            try {
                foodType = JSON.parse(foodType);
            } catch (error) {
                foodType = foodType.split(",").map((f: string) => f.trim().toUpperCase());
            }
        }
    } else {
        foodType = [];
    }

    // Prepare Restaurant Data
    const restaurantData: any = {
        restaurantName: data.restaurantName,
        restaurantDescription: data.restaurantDescription,
        restaurantType: data.restaurantType,
        cuisineType: cuisineType,
        foodType: foodType,
        restaurantWebsite: data.restaurantWebsite,
        restaurantAddress: address,
        restaurantOpenHours: openHours,
        restaurantImage: data.restaurantImage,
        restaurantImages: data.restaurantImages || [],
        approved: autoApprove,
        approvedAt: autoApprove ? new Date() : undefined,
    };

    // Start a Mongoose Session for Transaction
    const session = await mongoose.startSession();
    let createdUser;
    let createdRestaurant;

    try {
        session.startTransaction();

        // 1. Create User
        const user = new UserModel(userData);
        await user.save({ session });
        createdUser = user;

        // 2. Create Restaurant
        restaurantData.restaurantOwner = createdUser._id;
        const restaurant = new RestaurantModel(restaurantData);
        await restaurant.save({ session });
        createdRestaurant = restaurant;

        // 3. Update User with Restaurant ID
        createdUser.restaurantId = createdRestaurant._id;
        await createdUser.save({ session });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

    // Send emails (non-blocking, don't revert registration if email fails)
    try {
        sendVerificationEmail(createdUser.email as string, createdUser.name as string, verificationCode);
        sendWelcomeEmail(createdUser.email as string, createdUser.name as string);
    } catch (emailError) {
        console.error("Failed to send verification/welcome email:", emailError);
    }

    // Generate tokens
    const jwtPayload = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);
    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const userObject = createdUser.toObject();
    const { password: pwd, verificationToken: vToken, verificationExpiry: vExpiry, verificationCode: vCode, ...userWithoutSensitive } = userObject;

    return {
        user: userWithoutSensitive,
        restaurant: createdRestaurant,
        accessToken,
        refreshToken,
    };
};

export const authServices = {
    registerUser,
    registerRestaurant,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    getUserById,
    refreshAccessToken,
    requestPasswordReset,
    verifyOtp,
    resendOtp,
    resetPassword,
    updateProfile,
    addFcmToken,
    changePassword,
    updateEmail,
    resendEmailUpdate,
    verifyNewEmail,
    setUserPassword,
    updateLocation,
};
