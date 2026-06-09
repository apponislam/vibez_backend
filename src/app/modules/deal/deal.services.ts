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

const getAllDeals = async (query: any = {}) => {
    const filter: any = { isDeleted: false };
    if (query.restaurantId) filter.restaurantId = query.restaurantId;
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

    const deals = await DealModel.find(filter).populate("restaurantId").sort({ createdAt: -1 });
    return deals;
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
    const deal = await DealModel.findOneAndUpdate(
        { _id: dealId, isDeleted: false },
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    );
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
    const deal = await DealModel.findOneAndUpdate(
        { _id: dealId, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { returnDocument: "after" },
    );
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
