import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { SavedDealModel } from "./saved-deal.model";

// Toggle saved deal status (save if not exists, unsave if exists)
const toggleSavedDeal = async (userId: string, dealId: string) => {
    const filter = {
        userId: new Types.ObjectId(userId),
        dealId: new Types.ObjectId(dealId),
    };

    const exists = await SavedDealModel.findOne(filter);

    if (exists) {
        await SavedDealModel.deleteOne(filter);
        return { isSaved: false, message: "Deal removed from saved successfully" };
    } else {
        await SavedDealModel.create(filter);
        return { isSaved: true, message: "Deal saved successfully" };
    }
};

// Get user's saved deals with pagination (not used first, then used)
const getUserSavedDeals = async (userId: string, query: any = {}) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query.isUsed === "true") filter.isUsed = true;
    else if (query.isUsed === "false") filter.isUsed = false;
    const total = await SavedDealModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const savedDeals = await SavedDealModel.find(filter)
        .populate("dealId")
        .sort({ isUsed: 1, createdAt: -1 }) // not used first, then used; newest first within each group
        .skip(skip)
        .limit(limit);

    return {
        data: savedDeals,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};

// Count user's saved deals
const getSavedDealsCount = async (userId: string) => {
    const count = await SavedDealModel.countDocuments({ userId: new Types.ObjectId(userId) });
    return { count };
};

export const savedDealServices = {
    toggleSavedDeal,
    getUserSavedDeals,
    getSavedDealsCount,
};
