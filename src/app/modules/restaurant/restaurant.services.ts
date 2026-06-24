import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { RestaurantModel } from "./restaurant.model";
import { UserModel } from "../auth/auth.model";
import { getLatLngFromAddress } from "../../../utils/googleMaps";
import { FavoriteModel } from "../favorite/favorite.model";
import { DealModel } from "../deal/deal.model";
import { SavedDealModel } from "../saved-deal/saved-deal.model";
import { ReviewModel } from "../review/review.model";

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

        const latVal = address.lat;
        const lngVal = address.lng !== undefined ? address.lng : address.lan;

        if (latVal !== undefined && lngVal !== undefined && latVal !== "" && lngVal !== "") {
            const lat = parseFloat(latVal);
            const lng = parseFloat(lngVal);
            address.lat = lat.toString();
            address.lng = lng.toString();
            address.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        } else {
            const coords = await getLatLngFromAddress(address, data.restaurantName);
            if (coords) {
                address.lat = coords.lat.toString();
                address.lng = coords.lng.toString();
                address.location = {
                    type: "Point",
                    coordinates: [coords.lng, coords.lat],
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

const getAllRestaurants = async (filters: any = {}, userId?: string) => {
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

    let countQuery = { ...query };

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

        const radiusInRadians = parseFloat(filters.maxDistance) / 6378.1;
        countQuery["restaurantAddress.location"] = {
            $geoWithin: {
                $centerSphere: [[parseFloat(filters.lng), parseFloat(filters.lat)], radiusInRadians],
            },
        };
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([RestaurantModel.find(query).populate("restaurantOwner", "name email phone").skip(skip).limit(limit), RestaurantModel.countDocuments(countQuery)]);

    let resultData: any[] = [];
    if (userId) {
        const favorites = await FavoriteModel.find({ userId });
        const favoriteRestaurantIds = new Set(favorites.map((f) => f.restaurantId.toString()));
        resultData = restaurants.map((restaurant: any) => {
            const restaurantObj = restaurant.toObject ? restaurant.toObject() : restaurant;
            return {
                ...restaurantObj,
                isFavorite: favoriteRestaurantIds.has(restaurantObj._id.toString()),
            };
        });
    } else {
        resultData = restaurants.map((restaurant: any) => {
            const restaurantObj = restaurant.toObject ? restaurant.toObject() : restaurant;
            return {
                ...restaurantObj,
                isFavorite: false,
            };
        });
    }

    // Get user's saved deals if userId is present
    let savedDealIds = new Set<string>();
    if (userId) {
        const savedDeals = await SavedDealModel.find({ userId });
        savedDealIds = new Set(savedDeals.map((sd) => sd.dealId.toString()));
    }

    // Fetch and attach 2 recent active deals for each restaurant
    resultData = await Promise.all(
        resultData.map(async (restaurantObj: any) => {
            const recentDeals = await DealModel.find({
                restaurantId: restaurantObj._id,
                isActive: true,
                isDeleted: false,
            })
                .sort({ createdAt: -1 })
                .limit(2);

            const formattedDeals = recentDeals.map((deal) => {
                const dealObj = deal.toObject ? deal.toObject() : deal;
                return {
                    ...dealObj,
                    isSaved: userId ? savedDealIds.has(dealObj._id.toString()) : false,
                };
            });

            return {
                ...restaurantObj,
                recentDeals: formattedDeals,
            };
        }),
    );

    // Batch fetch average ratings for all restaurants
    const restaurantIds = resultData.map((r: any) => r._id);
    const ratingAggregates = await ReviewModel.aggregate([
        { $match: { restaurantId: { $in: restaurantIds }, isActive: true, isDeleted: false } },
        { $group: { _id: "$restaurantId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]);
    const ratingMap = new Map(ratingAggregates.map((r: any) => [r._id.toString(), r]));

    resultData = resultData.map((restaurantObj: any) => ({
        ...restaurantObj,
        averageRating: parseFloat((ratingMap.get(restaurantObj._id.toString())?.averageRating || 0).toFixed(1)),
        totalReviews: ratingMap.get(restaurantObj._id.toString())?.totalReviews || 0,
    }));

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: resultData,
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

    let countQuery = { ...query };

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

        const radiusInRadians = parseFloat(filters.maxDistance) / 6378.1;
        countQuery["restaurantAddress.location"] = {
            $geoWithin: {
                $centerSphere: [[parseFloat(filters.lng), parseFloat(filters.lat)], radiusInRadians],
            },
        };
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([RestaurantModel.find(query).populate("restaurantOwner", "name email phone").skip(skip).limit(limit), RestaurantModel.countDocuments(countQuery)]);

    const formattedRestaurants = await Promise.all(
        restaurants.map(async (restaurant) => {
            const restaurantObj = restaurant.toObject ? restaurant.toObject() : restaurant;
            const recentDeals = await DealModel.find({
                restaurantId: restaurantObj._id,
                isActive: true,
                isDeleted: false,
            })
                .sort({ createdAt: -1 })
                .limit(2);

            const formattedDeals = recentDeals.map((deal) => {
                const dealObj = deal.toObject ? deal.toObject() : deal;
                return {
                    ...dealObj,
                    isSaved: false,
                };
            });

            return {
                ...restaurantObj,
                recentDeals: formattedDeals,
            };
        }),
    );

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: formattedRestaurants,
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

const getRestaurantById = async (id: string, userId?: string) => {
    const restaurant = await RestaurantModel.findById(id).populate("restaurantOwner", "name email phone");
    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");

    const restaurantObj = restaurant.toObject ? restaurant.toObject() : restaurant;
    let isFavorite = false;

    if (userId) {
        const favorite = await FavoriteModel.findOne({ userId, restaurantId: restaurantObj._id });
        if (favorite) {
            isFavorite = true;
        }
    }

    const recentDeals = await DealModel.find({
        restaurantId: restaurantObj._id,
        isActive: true,
        isDeleted: false,
    })
        .sort({ createdAt: -1 })
        .limit(2);

    let savedDealIds = new Set<string>();
    if (userId) {
        const savedDeals = await SavedDealModel.find({ userId });
        savedDealIds = new Set(savedDeals.map((sd) => sd.dealId.toString()));
    }

    const formattedDeals = recentDeals.map((deal) => {
        const dealObj = deal.toObject ? deal.toObject() : deal;
        return {
            ...dealObj,
            isSaved: userId ? savedDealIds.has(dealObj._id.toString()) : false,
        };
    });

    const ratingAggregate = await ReviewModel.aggregate([
        { $match: { restaurantId: restaurant._id, isActive: true, isDeleted: false } },
        { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]);
    const averageRating = parseFloat((ratingAggregate[0]?.averageRating || 0).toFixed(1));
    const totalReviews = ratingAggregate[0]?.totalReviews || 0;

    return {
        ...restaurantObj,
        isFavorite,
        averageRating,
        totalReviews,
        recentDeals: formattedDeals,
    };
};

const getRestaurantByOwner = async (ownerId: string) => {
    const restaurant = await RestaurantModel.findOne({ restaurantOwner: ownerId });
    if (!restaurant) return null;

    const restaurantObj = restaurant.toObject ? restaurant.toObject() : restaurant;
    const recentDeals = await DealModel.find({
        restaurantId: restaurantObj._id,
        isActive: true,
        isDeleted: false,
    })
        .sort({ createdAt: -1 })
        .limit(2);

    const formattedDeals = recentDeals.map((deal) => {
        const dealObj = deal.toObject ? deal.toObject() : deal;
        return {
            ...dealObj,
            isSaved: false,
        };
    });

    return {
        ...restaurantObj,
        recentDeals: formattedDeals,
    };
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

        const latVal = address.lat;
        const lngVal = address.lng !== undefined ? address.lng : address.lan;

        if (latVal !== undefined && lngVal !== undefined && latVal !== "" && lngVal !== "") {
            const lat = parseFloat(latVal);
            const lng = parseFloat(lngVal);
            mergedAddress.lat = lat.toString();
            mergedAddress.lng = lng.toString();
            mergedAddress.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        } else {
            const coords = await getLatLngFromAddress(mergedAddress, data.restaurantName || existingRestaurant.restaurantName);
            if (coords) {
                mergedAddress.lat = coords.lat.toString();
                mergedAddress.lng = coords.lng.toString();
                mergedAddress.location = {
                    type: "Point",
                    coordinates: [coords.lng, coords.lat],
                };
            }
        }
        data.restaurantAddress = mergedAddress;
    }

    // Auto-derive openTime / closeTime from slots
    if (Array.isArray(data.restaurantOpenHours)) {
        data.restaurantOpenHours = data.restaurantOpenHours.map((hour: any) => {
            if (!hour.isOpen || !Array.isArray(hour.slots) || hour.slots.length === 0) {
                return hour;
            }
            const lunch = hour.slots.find((s: any) => s.type === "LUNCH");
            const dinner = hour.slots.find((s: any) => s.type === "DINNER");

            // openTime = lunch start (or first slot start)
            hour.openTime = lunch ? lunch.openTime : hour.slots[0].openTime;
            // closeTime = dinner end if exists, otherwise lunch end
            hour.closeTime = dinner ? dinner.closeTime : lunch ? lunch.closeTime : hour.slots[hour.slots.length - 1].closeTime;

            return hour;
        });
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
    const restaurant = await RestaurantModel.findByIdAndUpdate(id, { $set: { approved: true, approvedBy, approvedAt: new Date() } }, { new: true, runValidators: true }).populate("restaurantOwner", "name email phone");

    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    return restaurant;
};

const revokeRestaurantApproval = async (id: string) => {
    const restaurant = await RestaurantModel.findByIdAndUpdate(id, { $set: { approved: false, approvedBy: null, approvedAt: undefined } }, { new: true, runValidators: true }).populate("restaurantOwner", "name email phone");

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
