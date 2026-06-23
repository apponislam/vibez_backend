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

// Get user's saved deals
const getUserSavedDeals = async (userId: string) => {
    const savedDeals = await SavedDealModel.find({ userId: new Types.ObjectId(userId) })
        .populate("dealId")
        .sort({ createdAt: -1 });
    return savedDeals;
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
