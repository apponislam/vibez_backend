import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";
import { CommissionModel } from "../commission/commission.model";
import { WithdrawModel } from "../withdraw/withdraw.model";
import { UserSubscriptionStatus } from "../subscription/subscription.interface";

const getAllUsers = async (query: any) => {
    const { search, role, isInfluencer, isActive, page = 1, limit = 10 } = query;

    const filters: any = {};

    if (search) {
        filters.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
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

    const [users, total] = await Promise.all([
        UserModel.find(filters)
            .populate("referredBy", "name email")
            .populate("subscriptionPlanId", "name price duration")
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        UserModel.countDocuments(filters),
    ]);

    // Populate referrals count and active subscriptions count for each user
    const usersWithCounts = await Promise.all(
        users.map(async (user: any) => {
            const [referralsTotalCount, activeSubscriptionFromHimTotal] = await Promise.all([
                UserModel.countDocuments({ referredBy: user._id }),
                UserSubscriptionModel.countDocuments({ commissionUser: user._id, status: UserSubscriptionStatus.ACTIVE }),
            ]);
            return {
                ...user,
                referralsTotalCount,
                activeSubscriptionFromHimTotal,
            };
        })
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
    const user = await UserModel.findById(userId)
        .populate("referredBy", "name email")
        .populate("subscriptionPlanId")
        .lean();

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const [
        referralsTotalCount,
        activeSubscriptionFromHimTotal,
        referrals,
        commissions,
        withdrawals,
        subscriptions
    ] = await Promise.all([
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

    const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password").populate("referredBy", "name email").populate("subscriptionPlanId", "name price duration");

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
        UserModel.countDocuments({ role: "USER", isInfluencer: { $ne: true } }),
        UserModel.countDocuments({ isInfluencer: true }),
        UserModel.countDocuments({
            subscriptionPlanId: { $ne: null },
            subscriptionEndDate: { $gt: now }
        }),
    ]);

    return {
        totalUser,
        regularCustomer,
        influencer,
        premiumUser,
    };
};

export const userServices = {
    getAllUsers,
    getUserActivity,
    updateUserByAdmin,
    toggleUserActiveStatus,
    getUserStats,
};
