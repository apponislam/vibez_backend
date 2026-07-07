import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { DealModel } from "./deal.model";

import { UserModel } from "../auth/auth.model";
import { RestaurantModel } from "../restaurant/restaurant.model";
import { SavedDealModel } from "../saved-deal/saved-deal.model";
import { ReservationModel } from "../reservation/reservation.model";
import { ReservationStatus } from "../reservation/reservation.interface";
import { dashboardServices } from "../dashboard/dashboard.services";

const createDeal = async (userId: string, payload: any) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const userRole = user.role as string;
    if (userRole === "RESTAURANT_OWNER") {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: userId });
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant registered yet.");
        }
        payload.restaurantId = restaurant._id.toString();
    } else if (userRole === "ADMIN") {
        if (!payload.restaurantId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "restaurantId is required for admins");
        }
    } else {
        throw new ApiError(httpStatus.FORBIDDEN, "Only restaurant owners and admins can create deals.");
    }

    const deal = await DealModel.create({
        ...payload,
        createdBy: new Types.ObjectId(userId),
    });

    // Broadcast stats update
    if (deal.restaurantId) {
        dashboardServices.broadcastRestaurantStats(deal.restaurantId.toString()).catch(console.error);
    }

    return deal;
};

const getAllDeals = async (filters: any = {}) => {
    const query: any = { isDeleted: false };
    if (filters.restaurantId) query.restaurantId = filters.restaurantId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === "true";

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([DealModel.find(query).populate("restaurantId", "restaurantName restaurantImage restaurantDescription").skip(skip).limit(limit), DealModel.countDocuments(query)]);

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

const getActiveDeals = async (filters: any = {}, userId?: string) => {
    const query: any = { isActive: true, isDeleted: false };
    if (filters.restaurantId) {
        query.restaurantId = filters.restaurantId;
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([DealModel.find(query).populate("restaurantId", "restaurantName restaurantImage restaurantDescription").sort({ createdAt: -1 }).skip(skip).limit(limit), DealModel.countDocuments(query)]);

    let formattedDeals = deals.map((deal) => (deal.toObject ? deal.toObject() : deal));

    if (userId) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const [savedDeals, usedReservations] = await Promise.all([
            SavedDealModel.find({ userId }),
            ReservationModel.find({
                userId: new Types.ObjectId(userId),
                status: { $ne: ReservationStatus.CANCELLED },
                reservationDate: { $gte: threeMonthsAgo },
            }).select("dealId"),
        ]);

        const savedDealIds = new Set(savedDeals.map((sd) => sd.dealId.toString()));
        const usedDealIds = new Set(usedReservations.map((ur) => ur.dealId.toString()));

        formattedDeals = formattedDeals.map((deal: any) => ({
            ...deal,
            isSaved: savedDealIds.has(deal._id.toString()),
            isUsed: usedDealIds.has(deal._id.toString()),
        }));
    } else {
        formattedDeals = formattedDeals.map((deal: any) => ({
            ...deal,
            isSaved: false,
            isUsed: false,
        }));
    }

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: formattedDeals,
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

const getDealById = async (dealId: string, userId?: string) => {
    const deal = await DealModel.findOne({ _id: dealId, isDeleted: false }).populate("restaurantId", "restaurantName restaurantImage restaurantDescription");
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");

    const dealObj = deal.toObject ? deal.toObject() : deal;
    let isSaved = false;
    let isUsed = false;

    if (userId) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const [saved, reservation] = await Promise.all([
            SavedDealModel.findOne({ userId, dealId: dealObj._id }),
            ReservationModel.findOne({
                dealId: dealObj._id,
                userId: new Types.ObjectId(userId),
                status: { $ne: ReservationStatus.CANCELLED },
                reservationDate: { $gte: threeMonthsAgo },
            }),
        ]);

        if (saved) {
            isSaved = true;
        }
        if (reservation) {
            isUsed = true;
        }
    }

    return {
        ...dealObj,
        isSaved,
        isUsed,
    };
};

const updateDeal = async (dealId: string, payload: any, userId: string, userRole: string) => {
    if (userRole !== "ADMIN") {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: userId });
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant registered yet.");
        }
        const deal = await DealModel.findOne({ _id: dealId, isDeleted: false });
        if (!deal) {
            throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");
        }
        if (deal.restaurantId.toString() !== restaurant._id.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to modify this deal.");
        }
    }

    const deal = await DealModel.findOneAndUpdate({ _id: dealId, isDeleted: false }, { $set: payload }, { returnDocument: "after", runValidators: true });
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");

    // Broadcast stats update
    if (deal.restaurantId) {
        dashboardServices.broadcastRestaurantStats(deal.restaurantId.toString()).catch(console.error);
    }

    return deal;
};

const toggleDealStatus = async (dealId: string, userId: string, userRole: string) => {
    const deal = await DealModel.findOne({ _id: dealId, isDeleted: false });
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");

    if (userRole !== "ADMIN") {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: userId });
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant registered yet.");
        }
        if (deal.restaurantId.toString() !== restaurant._id.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to modify this deal.");
        }
    }

    deal.isActive = !deal.isActive;
    await deal.save();

    // Broadcast stats update
    if (deal.restaurantId) {
        dashboardServices.broadcastRestaurantStats(deal.restaurantId.toString()).catch(console.error);
    }

    return deal;
};

const deleteDeal = async (dealId: string, userId: string, userRole: string) => {
    const deal = await DealModel.findOne({ _id: dealId, isDeleted: false });
    if (!deal) throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");

    if (userRole !== "ADMIN") {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: userId });
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant registered yet.");
        }
        if (deal.restaurantId.toString() !== restaurant._id.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to modify this deal.");
        }
    }

    deal.isDeleted = true;
    deal.isActive = false;
    await deal.save();

    // Broadcast stats update
    if (deal.restaurantId) {
        dashboardServices.broadcastRestaurantStats(deal.restaurantId.toString()).catch(console.error);
    }

    return deal;
};

const getMyDeals = async (userId: string, query: any) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: userId });
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant registered yet.");
    }
    return await getAllDeals({ ...query, restaurantId: restaurant._id.toString() });
};

export const dealServices = {
    createDeal,
    getAllDeals,
    getActiveDeals,
    getDealById,
    updateDeal,
    toggleDealStatus,
    deleteDeal,
    getMyDeals,
};
