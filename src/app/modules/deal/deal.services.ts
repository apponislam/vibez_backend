import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { DealModel } from "./deal.model";

const createDeal = async (userId: string, payload: any) => {
    const deal = await DealModel.create({
        ...payload,
        createdBy: new Types.ObjectId(userId),
    });
    return deal;
};

const getAllDeals = async (filters: any = {}) => {
    const query: any = { isDeleted: false };
    if (filters.restaurantId) query.restaurantId = filters.restaurantId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === "true";

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([DealModel.find(query).populate("restaurantId").skip(skip).limit(limit), DealModel.countDocuments(query)]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: deals,
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

const getActiveDeals = async (restaurantId?: string) => {
    const filter: any = { isActive: true, isDeleted: false };
    if (restaurantId) {
        filter.restaurantId = restaurantId;
    }
    const deals = await DealModel.find(filter).populate("restaurantId").sort({ createdAt: -1 });
    return deals;
};

const getDealById = async (dealId: string) => {
    const deal = await DealModel.findOne({ _id: dealId, isDeleted: false }).populate("restaurantId");
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");
    return deal;
};

const updateDeal = async (dealId: string, payload: any) => {
    const deal = await DealModel.findOneAndUpdate({ _id: dealId, isDeleted: false }, { $set: payload }, { returnDocument: "after", runValidators: true });
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");
    return deal;
};

const toggleDealStatus = async (dealId: string) => {
    const deal = await DealModel.findOne({ _id: dealId, isDeleted: false });
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");
    deal.isActive = !deal.isActive;
    await deal.save();
    return deal;
};

const deleteDeal = async (dealId: string) => {
    const deal = await DealModel.findOneAndUpdate({ _id: dealId, isDeleted: false }, { $set: { isDeleted: true, isActive: false } }, { returnDocument: "after" });
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");
    return deal;
};

export const dealServices = {
    createDeal,
    getAllDeals,
    getActiveDeals,
    getDealById,
    updateDeal,
    toggleDealStatus,
    deleteDeal,
};
