import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { RestaurantModel } from "./restaurant.model";
import { IRestaurant } from "./resturant.interface";

const createRestaurant = async (data: Partial<IRestaurant>, ownerId: string) => {
    const restaurantData = { ...data, restaurantOwner: ownerId };
    const restaurant = await RestaurantModel.create(restaurantData);
    return restaurant;
};

const getAllRestaurants = async (filters: any = {}) => {
    let query: any = {};

    if (filters.cuisineType) {
        query.cuisineType = filters.cuisineType;
    }
    if (filters.restaurantType) {
        query.restaurantType = filters.restaurantType;
    }
    if (filters.search) {
        query.$or = [{ restaurantName: { $regex: filters.search, $options: "i" } }, { restaurantDescription: { $regex: filters.search, $options: "i" } }];
    }
    if (filters.lat && filters.lng && filters.maxDistance) {
        query["restaurantAddress.location"] = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(filters.lng), parseFloat(filters.lat)],
                },
                $maxDistance: parseFloat(filters.maxDistance) * 1000, // Convert km to meters
            },
        };
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([RestaurantModel.find(query).populate("restaurantOwner", "name email phone").skip(skip).limit(limit), RestaurantModel.countDocuments(query)]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: restaurants,
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

const getRestaurantById = async (id: string) => {
    const restaurant = await RestaurantModel.findById(id).populate("restaurantOwner", "name email phone");
    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    return restaurant;
};

const getRestaurantByOwner = async (ownerId: string) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: ownerId });
    return restaurant;
};

const updateRestaurant = async (id: string, data: Partial<IRestaurant>, ownerId: string) => {
    const restaurant = await RestaurantModel.findOneAndUpdate({ _id: id, restaurantOwner: ownerId }, { $set: data }, { new: true, runValidators: true }).populate("restaurantOwner", "name email phone");

    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found or not authorized");
    return restaurant;
};

const deleteRestaurant = async (id: string, ownerId: string) => {
    const restaurant = await RestaurantModel.findOneAndDelete({ _id: id, restaurantOwner: ownerId });
    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found or not authorized");
    return { message: "Restaurant deleted successfully" };
};

export const restaurantServices = {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    getRestaurantByOwner,
    updateRestaurant,
    deleteRestaurant,
};
