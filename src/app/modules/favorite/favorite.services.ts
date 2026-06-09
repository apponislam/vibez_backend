import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { FavoriteModel } from "./favorite.model";

// Add restaurant to favorites
const addFavorite = async (userId: string, restaurantId: string) => {
    const favorite = await FavoriteModel.create({
        userId: new Types.ObjectId(userId),
        restaurantId: new Types.ObjectId(restaurantId),
    });
    return favorite;
};

// Remove restaurant from favorites
const removeFavorite = async (userId: string, restaurantId: string) => {
    const favorite = await FavoriteModel.findOneAndDelete({
        userId: new Types.ObjectId(userId),
        restaurantId: new Types.ObjectId(restaurantId),
    });
    if (!favorite) throw new ApiError(httpStatus.NOT_FOUND, "Favorite not found");
    return favorite;
};

// Get user's favorite restaurants
const getUserFavorites = async (userId: string) => {
    const favorites = await FavoriteModel.find({ userId: new Types.ObjectId(userId) })
        .populate("restaurantId")
        .sort({ createdAt: -1 });
    return favorites;
};

// Check if a restaurant is favorited by user
const checkIsFavorite = async (userId: string, restaurantId: string) => {
    const exists = await FavoriteModel.exists({
        userId: new Types.ObjectId(userId),
        restaurantId: new Types.ObjectId(restaurantId),
    });
    return { isFavorite: !!exists };
};

export const favoriteServices = {
    addFavorite,
    removeFavorite,
    getUserFavorites,
    checkIsFavorite,
};
