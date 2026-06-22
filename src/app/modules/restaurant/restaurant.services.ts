import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { RestaurantModel } from "./restaurant.model";
import { IRestaurant } from "./resturant.interface";
import { UserModel } from "../auth/auth.model";
import { getLatLngFromAddress } from "../../../utils/googleMaps";

const createRestaurant = async (data: any, ownerId: string) => {
    let address = data.restaurantAddress;
    if (address) {
        if (typeof address === "string") {
            try {
                address = JSON.parse(address);
            } catch (error) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid restaurant address format");
            }
        }

        const coords = await getLatLngFromAddress(address);
        if (coords) {
            address.lat = coords.lat.toString();
            address.lng = coords.lng.toString();
            address.location = {
                type: "Point",
                coordinates: [coords.lng, coords.lat],
            };
        } else {
            // Fallback: If geocoding fails, check if lat/lng (or lan) are manually provided in input address
            const latVal = address.lat;
            const lngVal = address.lng !== undefined ? address.lng : address.lan;
            if (latVal !== undefined && lngVal !== undefined) {
                const lat = parseFloat(latVal);
                const lng = parseFloat(lngVal);
                address.lat = lat.toString();
                address.lng = lng.toString();
                address.location = {
                    type: "Point",
                    coordinates: [lng, lat],
                };
            }
        }
        data.restaurantAddress = address;
    }

    const restaurantData = { ...data, restaurantOwner: ownerId };
    const restaurant = await RestaurantModel.create(restaurantData);

    // Update Owner's User document with the new Restaurant ID
    await UserModel.findByIdAndUpdate(ownerId, { $set: { restaurantId: restaurant._id } });

    return restaurant;
};

const getAllRestaurants = async (filters: any = {}) => {
    let query: any = { approved: true };

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

const getAllRestaurantsForAdmin = async (filters: any = {}) => {
    let query: any = {};

    if (filters.approved !== undefined) {
        query.approved = filters.approved === "true";
    }
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
                $maxDistance: parseFloat(filters.maxDistance) * 1000,
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

const updateRestaurant = async (id: string, data: any, ownerId: string) => {
    const existingRestaurant = await RestaurantModel.findOne({ _id: id, restaurantOwner: ownerId });
    if (!existingRestaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found or not authorized");

    let address = data.restaurantAddress;
    if (address) {
        if (typeof address === "string") {
            try {
                address = JSON.parse(address);
            } catch (error) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid restaurant address format");
            }
        }

        // Merge updated address components with existing address components
        const mergedAddress = {
            ...existingRestaurant.restaurantAddress,
            ...address,
        };

        const coords = await getLatLngFromAddress(mergedAddress);
        if (coords) {
            mergedAddress.lat = coords.lat.toString();
            mergedAddress.lng = coords.lng.toString();
            mergedAddress.location = {
                type: "Point",
                coordinates: [coords.lng, coords.lat],
            };
        } else {
            // Fallback: If geocoding fails, check if lat/lng (or lan) are manually provided in input address
            const latVal = address.lat;
            const lngVal = address.lng !== undefined ? address.lng : address.lan;
            if (latVal !== undefined && lngVal !== undefined) {
                const lat = parseFloat(latVal);
                const lng = parseFloat(lngVal);
                mergedAddress.lat = lat.toString();
                mergedAddress.lng = lng.toString();
                mergedAddress.location = {
                    type: "Point",
                    coordinates: [lng, lat],
                };
            }
        }
        data.restaurantAddress = mergedAddress;
    }

    const restaurant = await RestaurantModel.findOneAndUpdate({ _id: id, restaurantOwner: ownerId }, { $set: data }, { new: true, runValidators: true }).populate("restaurantOwner", "name email phone");

    return restaurant;
};

const deleteRestaurant = async (id: string, ownerId: string) => {
    const restaurant = await RestaurantModel.findOneAndDelete({ _id: id, restaurantOwner: ownerId });
    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found or not authorized");
    return { message: "Restaurant deleted successfully" };
};

const approveRestaurant = async (id: string, approvedBy: string) => {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
        id,
        { $set: { approved: true, approvedBy, approvedAt: new Date() } },
        { new: true, runValidators: true }
    ).populate("restaurantOwner", "name email phone");

    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    return restaurant;
};

const revokeRestaurantApproval = async (id: string) => {
    const restaurant = await RestaurantModel.findByIdAndUpdate(
        id,
        { $set: { approved: false, approvedBy: null, approvedAt: undefined } },
        { new: true, runValidators: true }
    ).populate("restaurantOwner", "name email phone");

    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    return restaurant;
};

export const restaurantServices = {
    createRestaurant,
    getAllRestaurants,
    getAllRestaurantsForAdmin,
    getRestaurantById,
    getRestaurantByOwner,
    updateRestaurant,
    deleteRestaurant,
    approveRestaurant,
    revokeRestaurantApproval,
};
