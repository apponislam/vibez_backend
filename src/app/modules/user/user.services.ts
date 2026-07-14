import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";
import { CommissionModel } from "../commission/commission.model";
import { WithdrawModel } from "../withdraw/withdraw.model";
import { UserSubscriptionStatus } from "../subscription/subscription.interface";
import { RestaurantModel } from "../restaurant/restaurant.model";
import { sendStaffWelcomeEmail, sendStaffPasswordResetEmail } from "../../../utils/emailTemplates";
import bcrypt from "bcrypt";
import config from "../../config";

const getAllUsers = async (query: any) => {
    const { search, role, isInfluencer, isActive, page = 1, limit = 10 } = query;

    const filters: any = {};

    if (search) {
        filters.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    }
    if (role) {
        filters.role = role;
    }
    if (isInfluencer !== undefined) {
        filters.isInfluencer = isInfluencer === "true";
    }
    if (isActive !== undefined) {
        filters.isActive = isActive === "true";
    }

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const [users, total] = await Promise.all([UserModel.find(filters).populate("referredBy", "name email").populate("subscriptionPlanId", "name price duration isFreeTrial freeTrialDays").skip(skip).limit(parsedLimit).lean(), UserModel.countDocuments(filters)]);

    // Populate referrals count and active subscriptions count for each user
    const usersWithCounts = await Promise.all(
        users.map(async (user: any) => {
            const [referralsTotalCount, activeSubscriptionFromHimTotal] = await Promise.all([UserModel.countDocuments({ referredBy: user._id }), UserSubscriptionModel.countDocuments({ commissionUser: user._id, status: UserSubscriptionStatus.ACTIVE })]);
            return {
                ...user,
                referralsTotalCount,
                activeSubscriptionFromHimTotal,
            };
        }),
    );

    const totalPages = Math.ceil(total / parsedLimit);
    const hasNext = parsedPage < totalPages;
    const hasPrev = parsedPage > 1;

    return {
        data: usersWithCounts,
        meta: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const getUserActivity = async (userId: string) => {
    const user = await UserModel.findById(userId).populate("referredBy", "name email").populate("subscriptionPlanId").lean();

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const [referralsTotalCount, activeSubscriptionFromHimTotal, referrals, commissions, withdrawals, subscriptions] = await Promise.all([
        UserModel.countDocuments({ referredBy: userId }),
        UserSubscriptionModel.countDocuments({ commissionUser: userId, status: UserSubscriptionStatus.ACTIVE }),
        UserModel.find({ referredBy: userId }).select("name email isActive isInfluencer createdAt").lean(),
        CommissionModel.find({ commissionUser: userId }).populate("commissionFrom", "name email").lean(),
        WithdrawModel.find({ userId: userId }).lean(),
        UserSubscriptionModel.find({ userId: userId }).populate("subscriptionPlanId").lean(),
    ]);

    return {
        user: {
            ...user,
            referralsTotalCount,
            activeSubscriptionFromHimTotal,
        },
        referrals,
        commissions,
        withdrawals,
        subscriptions,
    };
};

const updateUserByAdmin = async (userId: string, data: any) => {
    const allowedUpdates = ["isInfluencer", "commissionPercentage", "maxPayout", "commissionDuration"];
    const updateData: any = {};

    for (const key of allowedUpdates) {
        if (data[key] !== undefined) {
            updateData[key] = data[key];
        }
    }

    const user = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, { returnDocument: "after", runValidators: true }).select("-password").populate("referredBy", "name email").populate("subscriptionPlanId", "name price duration isFreeTrial freeTrialDays");

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
};

const toggleUserActiveStatus = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    user.isActive = !user.isActive;
    await user.save();

    const userObject = user.toObject();
    const { password, ...userWithoutPassword } = userObject;
    return userWithoutPassword;
};

const getUserStats = async () => {
    const now = new Date();
    const [totalUser, regularCustomer, influencer, premiumUser] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({
            role: "USER",
            $or: [{ isInfluencer: false }, { isInfluencer: { $exists: false } }, { isInfluencer: null }],
        }),
        UserModel.countDocuments({ isInfluencer: true }),
        UserModel.countDocuments({
            subscriptionPlanId: { $ne: null },
            subscriptionEndDate: { $gt: now },
        }),
    ]);

    return {
        totalUser,
        regularCustomer,
        influencer,
        premiumUser,
    };
};

const createStaffByOwner = async (ownerId: string, staffData: any) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: ownerId });
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You must register a restaurant before creating staff.");
    }

    const existingUser = await UserModel.findOne({ email: staffData.email });
    if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(staffData.password, Number(config.bcrypt_salt_rounds));

    const staff = await UserModel.create({
        name: staffData.name,
        email: staffData.email,
        password: hashedPassword,
        role: "STAFF",
        staffRole: staffData.staffRole,
        restaurantId: restaurant._id,
        phone: staffData.phone,
        profileImage: staffData.profileImage,
        isActive: true,
        isEmailVerified: true,
    });

    sendStaffWelcomeEmail(staff.email, staff.name, staffData.password, restaurant.restaurantName);

    const staffObject = staff.toObject();
    const { password, ...staffWithoutPassword } = staffObject;
    return staffWithoutPassword;
};

const getStaffByOwner = async (ownerId: string, query: any) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: ownerId });
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found.");
    }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter = { restaurantId: restaurant._id, role: "STAFF" as const, isDeleted: false };

    const [staff, total] = await Promise.all([UserModel.find(filter).select("-password").skip(skip).limit(limit), UserModel.countDocuments(filter)]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: staff,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const toggleStaffLoginStatus = async (ownerId: string, staffId: string) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: ownerId });
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found.");
    }

    const staff = await UserModel.findOne({ _id: staffId, restaurantId: restaurant._id, role: "STAFF" });
    if (!staff) {
        throw new ApiError(httpStatus.NOT_FOUND, "Staff member not found under your restaurant.");
    }

    staff.enableStaffLogin = !staff.enableStaffLogin;
    await staff.save();

    const staffObject = staff.toObject();
    const { password, ...staffWithoutPassword } = staffObject;
    return staffWithoutPassword;
};

const toggleAllStaffLoginStatus = async (ownerId: string, enable?: boolean) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: ownerId });
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found.");
    }

    let targetStatus = enable;
    if (targetStatus === undefined) {
        const activeStaff = await UserModel.findOne({ restaurantId: restaurant._id, role: "STAFF", enableStaffLogin: true, isDeleted: false });
        targetStatus = !activeStaff;
    }

    await UserModel.updateMany({ restaurantId: restaurant._id, role: "STAFF", isDeleted: false }, { $set: { enableStaffLogin: targetStatus } });

    return { enableStaffLogin: targetStatus };
};

const changeStaffPasswordByOwner = async (callerId: string, callerRole: string, staffId: string, newPassword: string) => {
    let staff;

    if (callerRole === "ADMIN") {
        staff = await UserModel.findOne({ _id: staffId, role: "STAFF" });
    } else {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: callerId });
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found.");
        }
        staff = await UserModel.findOne({ _id: staffId, restaurantId: restaurant._id, role: "STAFF" });
    }

    if (!staff) {
        throw new ApiError(httpStatus.NOT_FOUND, "Staff member not found.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    staff.password = hashedPassword;
    await staff.save();

    // Fetch restaurant name if possible
    let restaurantName = "";
    if (staff.restaurantId) {
        const restaurant = await RestaurantModel.findById(staff.restaurantId);
        if (restaurant) {
            restaurantName = restaurant.restaurantName;
        }
    }

    // Send email to staff with new password
    sendStaffPasswordResetEmail(staff.email as string, staff.name as string, newPassword, restaurantName);

    const staffObject = staff.toObject();
    const { password, ...staffWithoutPassword } = staffObject;
    return staffWithoutPassword;
};

const updateStaffDetailsByOwner = async (callerId: string, callerRole: string, staffId: string, updateData: any) => {
    let staff;

    if (callerRole === "ADMIN") {
        staff = await UserModel.findOne({ _id: staffId, role: "STAFF" });
    } else {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: callerId });
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found.");
        }
        staff = await UserModel.findOne({ _id: staffId, restaurantId: restaurant._id, role: "STAFF" });
    }

    if (!staff) {
        throw new ApiError(httpStatus.NOT_FOUND, "Staff member not found.");
    }

    const allowedUpdates = ["name", "phone", "staffRole", "profileImage", "email"];
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            if (key === "email" && updateData.email !== staff.email) {
                const existingUser = await UserModel.findOne({ email: updateData.email });
                if (existingUser) {
                    throw new ApiError(httpStatus.BAD_REQUEST, "Email already registered");
                }
            }
            (staff as any)[key] = updateData[key];
        }
    }

    await staff.save();

    const staffObject = staff.toObject();
    const { password, ...staffWithoutPassword } = staffObject;
    return staffWithoutPassword;
};

export const userServices = {
    getAllUsers,
    getUserActivity,
    updateUserByAdmin,
    toggleUserActiveStatus,
    getUserStats,
    createStaffByOwner,
    getStaffByOwner,
    toggleStaffLoginStatus,
    toggleAllStaffLoginStatus,
    changeStaffPasswordByOwner,
    updateStaffDetailsByOwner,
};
