import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { SavedDealModel } from "./saved-deal.model";

// Add deal to saved deals
const saveDeal = async (userId: string, dealId: string) => {
    const savedDeal = await SavedDealModel.create({
        userId: new Types.ObjectId(userId),
        dealId: new Types.ObjectId(dealId),
    });
    return savedDeal;
};

// Remove deal from saved deals
const unsaveDeal = async (userId: string, dealId: string) => {
    const savedDeal = await SavedDealModel.findOneAndDelete({
        userId: new Types.ObjectId(userId),
        dealId: new Types.ObjectId(dealId),
    });
    if (!savedDeal) throw new ApiError(httpStatus.NOT_FOUND, "Saved deal not found");
    return savedDeal;
};

// Get user's saved deals
const getUserSavedDeals = async (userId: string) => {
    const savedDeals = await SavedDealModel.find({ userId: new Types.ObjectId(userId) })
        .populate("dealId")
        .sort({ createdAt: -1 });
    return savedDeals;
};

// Check if a deal is saved by user
const checkIsSaved = async (userId: string, dealId: string) => {
    const exists = await SavedDealModel.exists({
        userId: new Types.ObjectId(userId),
        dealId: new Types.ObjectId(dealId),
    });
    return { isSaved: !!exists };
};

export const savedDealServices = {
    saveDeal,
    unsaveDeal,
    getUserSavedDeals,
    checkIsSaved,
};
