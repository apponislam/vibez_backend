import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { FavoriteModel } from "./favorite.model";
import { DealModel } from "../deal/deal.model";

// Toggle restaurant favorite status (add if not exists, remove if exists)
const toggleFavorite = async (userId: string, restaurantId: string) => {
    const filter = {
        userId: new Types.ObjectId(userId),
        restaurantId: new Types.ObjectId(restaurantId),
    };

    const exists = await FavoriteModel.findOne(filter);

    if (exists) {
        await FavoriteModel.deleteOne(filter);
        return { isFavorited: false, message: "Restaurant removed from favorites" };
    } else {
        await FavoriteModel.create(filter);
        return { isFavorited: true, message: "Restaurant added to favorites" };
    }
};

// Get user's favorite restaurants
const getUserFavorites = async (userId: string) => {
    const favorites = await FavoriteModel.find({ userId: new Types.ObjectId(userId) })
        .populate("restaurantId")
        .sort({ createdAt: -1 });

    const formattedFavorites = await Promise.all(
        favorites.map(async (favorite) => {
            const favObj = (favorite.toObject ? favorite.toObject() : favorite) as any;
            
            if (favObj.restaurantId) {
                const recentDeals = await DealModel.find({
                    restaurantId: favObj.restaurantId._id || favObj.restaurantId,
                    isActive: true,
                    isDeleted: false,
                })
                    .sort({ createdAt: -1 })
                    .limit(2);

                favObj.recentDeals = recentDeals;
            }
            return favObj;
        })
    );

    return formattedFavorites;
};

// Count user's favorite restaurants
const getFavoritesCount = async (userId: string) => {
    const count = await FavoriteModel.countDocuments({ userId: new Types.ObjectId(userId) });
    return { count };
};

export const favoriteServices = {
    toggleFavorite,
    getUserFavorites,
    getFavoritesCount,
};
