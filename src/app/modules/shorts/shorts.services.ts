import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ShortsModel } from "./shorts.model";
import { restaurantServices } from "../restaurant/restaurant.services";
import { FavoriteModel } from "../favorite/favorite.model";

// Upload or update restaurant short
const uploadShorts = async (userId: string, shortUrl: string) => {
    // First, check if user has a restaurant
    const restaurant = await restaurantServices.getRestaurantByOwner(userId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant");
    }

    // Check if there's already a short for this restaurant
    let short = await ShortsModel.findOne({ restaurantId: restaurant._id });

    if (short) {
        // Update existing short
        short.shortUrl = shortUrl;
        await short.save();
    } else {
        // Create new short
        short = await ShortsModel.create({
            restaurantId: restaurant._id,
            shortUrl: shortUrl,
        });
    }

    // Populate only simple restaurant details before returning
    await short.populate("restaurantId", "restaurantName restaurantImage restaurantDescription");
    return short;
};

// Get restaurant short by restaurant ID (public route)
const getShortsByRestaurant = async (restaurantId: string) => {
    const short = await ShortsModel.findOne({
        restaurantId: new Types.ObjectId(restaurantId),
        isActive: true,
    }).populate("restaurantId", "restaurantName restaurantImage restaurantDescription");
    return short;
};

// Get owner's restaurant short (private route)
const getMyShorts = async (userId: string) => {
    const restaurant = await restaurantServices.getRestaurantByOwner(userId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant");
    }

    const short = await ShortsModel.findOne({ restaurantId: restaurant._id }).populate("restaurantId", "restaurantName restaurantImage restaurantDescription");
    return short;
};

// Delete restaurant short
const deleteShorts = async (userId: string) => {
    const restaurant = await restaurantServices.getRestaurantByOwner(userId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "You don't have a restaurant");
    }

    const short = await ShortsModel.findOneAndDelete({ restaurantId: restaurant._id }).populate("restaurantId", "restaurantName restaurantImage restaurantDescription");
    if (!short) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant short not found");
    }
    return short;
};

// Get random shorts with pagination (for scroll system)
const getRandomShorts = async (filters: any = {}, userId?: string) => {
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
                    pipeline: [
                        {
                            $project: {
                                restaurantName: 1,
                                restaurantImage: 1,
                                restaurantDescription: 1,
                            },
                        },
                    ],
                    as: "restaurantId",
                },
            },
            { $unwind: "$restaurantId" },
        ]),
        ShortsModel.countDocuments({ isActive: true }),
    ]);

    // Check favorites if userId is provided
    const favoriteRestaurantIds = new Set<string>();
    if (userId) {
        const favorites = await FavoriteModel.find({ userId });
        favorites.forEach((fav) => {
            favoriteRestaurantIds.add(fav.restaurantId.toString());
        });
    }

    const formattedShorts = shorts.map((short: any) => ({
        ...short,
        isSaved: favoriteRestaurantIds.has(short.restaurantId._id.toString()),
    }));

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: formattedShorts,
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

const toggleSaveShorts = async (userId: string, shortId: string) => {
    const short = await ShortsModel.findById(shortId);
    if (!short) {
        throw new ApiError(httpStatus.NOT_FOUND, "Short not found");
    }

    const filter = {
        userId: new Types.ObjectId(userId),
        restaurantId: short.restaurantId,
    };

    const exists = await FavoriteModel.findOne(filter);

    if (exists) {
        // Remove from favorites
        await FavoriteModel.deleteOne(filter);

        // Decrement saveCount
        short.saveCount = Math.max(0, (short.saveCount || 0) - 1);
        await short.save();

        return { isSaved: false, saveCount: short.saveCount, message: "Short unsaved successfully" };
    } else {
        // Add to favorites
        await FavoriteModel.create(filter);

        // Increment saveCount
        short.saveCount = (short.saveCount || 0) + 1;
        await short.save();

        return { isSaved: true, saveCount: short.saveCount, message: "Short saved successfully" };
    }
};

const incrementShareCount = async (shortId: string) => {
    const short = await ShortsModel.findByIdAndUpdate(
        shortId,
        { $inc: { shareCount: 1 } },
        { returnDocument: 'after' }
    );
    if (!short) {
        throw new ApiError(httpStatus.NOT_FOUND, "Short not found");
    }
    return { shareCount: short.shareCount };
};

export const shortsServices = {
    uploadShorts,
    getShortsByRestaurant,
    getMyShorts,
    deleteShorts,
    getRandomShorts,
    toggleSaveShorts,
    incrementShareCount,
};
