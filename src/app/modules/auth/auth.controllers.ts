import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import config from "../../config";
import { Request, Response } from "express";
import { authServices } from "./auth.services";
import { getSocket } from "../../socket/socket";

const register = catchAsync(async (req: Request, res: Response) => {
    // Handle profile image if uploaded
    let profileImageUrl = undefined;
    if (req.file) {
        profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }

    // Parse the body field if it's a string
    let data: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        data = JSON.parse(req.body.body);
    }

    // Parse JSON fields
    const userData: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
        referredByCode: data.referredByCode || data.referralCode,
        referredBy: data.referredBy,
        ...(profileImageUrl && { profileImage: profileImageUrl }),
        ...(data.preferences && { preferences: data.preferences }),
    };

    // Basic validation
    if (!userData.name || !userData.email || !userData.password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Name, email, and password are required");
    }

    // Location is already parsed
    if (data.location) userData.location = data.location;

    const result = await authServices.registerUser(userData);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    const otp = req.query.otp as string | undefined;
    const email = req.query.email as string;

    if (!email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
    }

    await authServices.verifyEmail(email, token, otp);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email verified successfully",
        data: null,
    });
});

const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authServices.resendVerificationEmail(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification email resent successfully",
        data: null,
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await authServices.getUserById(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: user,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("refreshToken");

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Logout successful",
        data: null,
    });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const result = await authServices.refreshAccessToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Token refreshed successfully",
        data: result,
    });
});

const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
    await authServices.requestPasswordReset(req.body.email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset OTP sent to email",
        data: null,
    });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await authServices.verifyOtp(req.body.email, req.body.otp);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "OTP verified successfully",
        data: { token: result.token },
    });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
    await authServices.resendOtp(req.body.email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "OTP resent successfully",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = (req.query.token as string) || req.body.token;
    await authServices.resetPassword(token, req.body.newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset successful",
        data: null,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    // Handle profile image if uploaded
    let profileImageUrl = undefined;
    if (req.file) {
        profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }

    // Parse the body field if it's a string (standard for multipart/form-data)
    let data: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        try {
            data = JSON.parse(req.body.body);
        } catch (error) {
            // Fallback for cases where the body might be partially formatted
            try {
                const bodyStr = `{${req.body.body}}`;
                data = JSON.parse(bodyStr);
            } catch (innerError) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in request body");
            }
        }
    } else {
        data = req.body;
    }

    // Construct update data based on the provided fields
    const updateData: any = {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.language && { language: data.language }),
        ...(profileImageUrl && { profileImage: profileImageUrl }),
        ...(data.location && { location: data.location }),
        ...(data.address && { address: data.address }),
        ...(data.availabilityLocation && { availabilityLocation: data.availabilityLocation }),
        ...(data.preferences && { preferences: data.preferences }),
        ...(data.aboutme && { aboutme: data.aboutme }),
    };

    const updatedUser = await authServices.updateProfile(req.user._id, updateData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    await authServices.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password changed successfully",
        data: null,
    });
});

const updateEmail = catchAsync(async (req: Request, res: Response) => {
    await authServices.updateEmail(req.user._id, req.body.email, req.body.password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email update requested. Please verify new email.",
        data: null,
    });
});

const resendEmailUpdate = catchAsync(async (req: Request, res: Response) => {
    await authServices.resendEmailUpdate(req.user._id, req.body.password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email verification resent successfully",
        data: null,
    });
});

const verifyNewEmail = catchAsync(async (req: Request, res: Response) => {
    const { token, email } = req.query;
    await authServices.verifyNewEmail(token as string, email as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New email verified successfully",
        data: null,
    });
});

const setUserPassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { password } = req.body;
    await authServices.setUserPassword(userId, password);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password set successfully",
        data: null,
    });
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
    const { lat, lng } = req.body;
    const userId = req.user._id;

    if (lat === undefined || lng === undefined) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Latitude and longitude are required");
    }

    const updatedUser = await authServices.updateLocation(userId, lat, lng);

    // Emit socket event for real-time update
    const io = getSocket();
    io.emit("location_updated", {
        userId: userId,
        location: { lat, lng },
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Location updated successfully",
        data: updatedUser,
    });
});

const approveUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const approvedBy = req.user._id;
    const user = await authServices.approveUser(userId, approvedBy);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User approved successfully",
        data: user,
    });
});

const revokeUserApproval = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const user = await authServices.revokeUserApproval(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User approval revoked successfully",
        data: user,
    });
});

const registerRestaurant = catchAsync(async (req: Request, res: Response) => {
    // Parse the body field if it's a string
    let data: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        try {
            data = JSON.parse(req.body.body);
        } catch (error) {
            try {
                const bodyStr = `{${req.body.body}}`;
                data = JSON.parse(bodyStr);
            } catch (innerError) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in request body");
            }
        }
    } else {
        data = req.body;
    }

    // Attach profileImage and restaurantImage from req.body (populated by multer uploadRestaurantRegistration middleware)
    if (req.body.profileImage) {
        data.profileImage = req.body.profileImage;
    }
    if (req.body.restaurantImage) {
        data.restaurantImage = req.body.restaurantImage;
    }

    // Basic validation
    if (!data.email || !data.password || !data.name || !data.restaurantName || !data.restaurantType || !data.cuisineType || !data.restaurantAddress) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    const result = await authServices.registerRestaurant(data);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Restaurant owner registered and restaurant created successfully",
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
});

export const authControllers = {
    register,
    registerRestaurant,
    login,
    verifyEmail,
    resendVerificationEmail,
    getMe,
    logout,
    refreshAccessToken,
    requestPasswordReset,
    verifyOtp,
    resendOtp,
    resetPassword,
    updateProfile,
    changePassword,
    updateEmail,
    resendEmailUpdate,
    verifyNewEmail,
    setUserPassword,
    updateLocation,
    approveUser,
    revokeUserApproval,
};
