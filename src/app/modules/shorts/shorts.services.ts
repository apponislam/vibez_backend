import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ShortsModel } from "./shorts.model";
import { restaurantServices } from "../restaurant/restaurant.services";

// Upload or update restaurant short
const uploadShorts = async (userId: string, shortUrl: string) => {
    // First, check if user has a restaurant
    const restaurant = await restaurantServices.getRestaurantByOwner(userId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant");
    }

    // Check if there's already a short for this restaurant
    const existingShort = await ShortsModel.findOne({ restaurantId: restaurant._id });

    if (existingShort) {
        // Update existing short
        existingShort.shortUrl = shortUrl;
        await existingShort.save();
        return existingShort;
    } else {
        // Create new short
        const newShort = await ShortsModel.create({
            restaurantId: restaurant._id,
            shortUrl: shortUrl,
        });
        return newShort;
    }
};

// Get restaurant short by restaurant ID (public route)
const getShortsByRestaurant = async (restaurantId: string) => {
    const short = await ShortsModel.findOne({
        restaurantId: new Types.ObjectId(restaurantId),
        isActive: true,
    });
    return short;
};

// Get owner's restaurant short (private route)
const getMyShorts = async (userId: string) => {
    const restaurant = await restaurantServices.getRestaurantByOwner(userId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant");
    }

    const short = await ShortsModel.findOne({ restaurantId: restaurant._id });
    return short;
};

// Delete restaurant short
const deleteShorts = async (userId: string) => {
    const restaurant = await restaurantServices.getRestaurantByOwner(userId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant");
    }

    const short = await ShortsModel.findOneAndDelete({ restaurantId: restaurant._id });
    if (!short) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant short not found");
    }
    return short;
};

// Get random shorts with pagination (for scroll system)
const getRandomShorts = async (filters: any = {}) => {
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Use aggregation to get random shorts
    const [shorts, total] = await Promise.all([
        ShortsModel.aggregate([
            { $match: { isActive: true } },
            { $sample: { size: limit * 2 } }, // Get more to ensure enough after skip
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "restaurants",
                    localField: "restaurantId",
                    foreignField: "_id",
                    as: "restaurant",
                },
            },
            { $unwind: "$restaurant" },
        ]),
        ShortsModel.countDocuments({ isActive: true }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: shorts,
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

export const shortsServices = {
    uploadShorts,
    getShortsByRestaurant,
    getMyShorts,
    deleteShorts,
    getRandomShorts,
};
