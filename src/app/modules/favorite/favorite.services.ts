import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { FavoriteModel } from "./favorite.model";

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
    return favorites;
};

export const favoriteServices = {
    toggleFavorite,
    getUserFavorites,
};
