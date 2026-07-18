import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { RestaurantModel } from "./restaurant.model";
import { getLatLngFromAddress } from "../../../utils/googleMaps";
import { FavoriteModel } from "../favorite/favorite.model";
import { DealModel } from "../deal/deal.model";
import { SavedDealModel } from "../saved-deal/saved-deal.model";
import { ReviewModel } from "../review/review.model";
import { ReservationModel } from "../reservation/reservation.model";
import { ReservationStatus } from "../reservation/reservation.interface";

const getAllRestaurants = async (filters: any = {}, userId?: string) => {
    let query: any = { approved: true };

    if (filters.cuisineType) {
        if (typeof filters.cuisineType === "string") {
            const cuisines = filters.cuisineType.split(",").map((c: string) => c.trim().toUpperCase());
            query.cuisineType = { $in: cuisines };
        } else if (Array.isArray(filters.cuisineType)) {
            query.cuisineType = { $in: filters.cuisineType };
        } else {
            query.cuisineType = filters.cuisineType;
        }
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
    const minRating = filters.minRating ? parseFloat(filters.minRating as string) : undefined;
    const openNow = filters.openNow === "true";
    const useInMemoryFiltering = (minRating !== undefined && !isNaN(minRating)) || openNow;

    let restaurants;
    let total = 0;

    if (useInMemoryFiltering) {
        // If minRating or openNow is provided, fetch all matching restaurants first to calculate/filter ratings/hours
        restaurants = await RestaurantModel.find(query).populate("restaurantOwner", "name email phone");
    } else {
        // Normal fast paginated query
        [restaurants, total] = await Promise.all([
            RestaurantModel.find(query).populate("restaurantOwner", "name email phone").skip(skip).limit(limit),
            RestaurantModel.countDocuments(countQuery),
        ]);
    }

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

    if (minRating !== undefined && !isNaN(minRating)) {
        // Filter by minRating
        resultData = resultData.filter((r: any) => r.averageRating >= minRating);
    }

    if (openNow) {
        let currentDayName: string;
        let currentTimeStr: string;

        if (filters.clientDay && filters.clientTime) {
            currentDayName = (filters.clientDay as string).toUpperCase();
            currentTimeStr = filters.clientTime as string;
        } else {
            const now = new Date();
            const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
            currentDayName = dayNames[now.getDay()];
            const currentHour = now.getHours().toString().padStart(2, "0");
            const currentMinute = now.getMinutes().toString().padStart(2, "0");
            currentTimeStr = `${currentHour}:${currentMinute}`;
        }

        const timeToMinutes = (timeStr: string): number => {
            if (!timeStr) return 0;
            const parts = timeStr.split(":");
            if (parts.length < 2) return 0;
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            return hours * 60 + minutes;
        };

        const currentMinutes = timeToMinutes(currentTimeStr);

        const checkTimeInRange = (open: string, close: string, current: number): boolean => {
            if (!open || !close) return false;
            const openMins = timeToMinutes(open);
            const closeMins = timeToMinutes(close);

            if (closeMins < openMins) {
                // Over midnight (e.g., 18:00 to 02:00)
                return current >= openMins || current <= closeMins;
            }
            return current >= openMins && current <= closeMins;
        };

        resultData = resultData.filter((restaurantObj: any) => {
            const todayHours = restaurantObj.restaurantOpenHours?.find(
                (h: any) => h.day === currentDayName
            );
            if (!todayHours || !todayHours.isOpen) {
                return false;
            }

            // Check primary openTime and closeTime
            if (todayHours.openTime && todayHours.closeTime) {
                if (checkTimeInRange(todayHours.openTime, todayHours.closeTime, currentMinutes)) {
                    return true;
                }
            }

            // Check slots
            if (todayHours.slots && todayHours.slots.length > 0) {
                for (const slot of todayHours.slots) {
                    if (checkTimeInRange(slot.openTime, slot.closeTime, currentMinutes)) {
                        return true;
                    }
                }
            }

            return false;
        });
    }

    if (useInMemoryFiltering) {
        total = resultData.length;
        // Paginate in-memory
        resultData = resultData.slice(skip, skip + limit);
    }

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
        if (typeof filters.cuisineType === "string") {
            const cuisines = filters.cuisineType.split(",").map((c: string) => c.trim().toUpperCase());
            query.cuisineType = { $in: cuisines };
        } else if (Array.isArray(filters.cuisineType)) {
            query.cuisineType = { $in: filters.cuisineType };
        } else {
            query.cuisineType = filters.cuisineType;
        }
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

    const [restaurants, total] = await Promise.all([
        RestaurantModel.find(query)
            .select("restaurantName restaurantImage approved createdAt restaurantOwner")
            .populate("restaurantOwner", "name email phone profileImage")
            .skip(skip)
            .limit(limit),
        RestaurantModel.countDocuments(countQuery)
    ]);

    const formattedRestaurants = await Promise.all(
        restaurants.map(async (restaurant) => {
            const restaurantId = restaurant._id;

            // 1. Count Active Deals
            const activeDeals = await DealModel.countDocuments({
                restaurantId,
                isActive: true,
                isDeleted: false,
            });

            // 2. Count Total Bookings (reservations not cancelled)
            const totalBookings = await ReservationModel.countDocuments({
                restaurantId,
                status: { $ne: ReservationStatus.CANCELLED }
            });

            // 3. Calculate Redemption Rate
            const deals = await DealModel.find({ restaurantId }).select("_id");
            const dealIds = deals.map(d => d._id);
            const totalSaved = await SavedDealModel.countDocuments({ dealId: { $in: dealIds } });
            const totalUsed = await ReservationModel.countDocuments({
                restaurantId,
                dealId: { $ne: null },
                status: { $ne: ReservationStatus.CANCELLED }
            });
            const totalClaims = totalSaved + totalUsed;
            const redemptionRate = totalClaims > 0 ? Number(((totalUsed / totalClaims) * 100).toFixed(1)) : 0;

            return {
                _id: restaurant._id,
                restaurantName: restaurant.restaurantName,
                restaurantImage: restaurant.restaurantImage,
                approved: restaurant.approved,
                createdAt: (restaurant as any).createdAt,
                restaurantOwner: restaurant.restaurantOwner,
                activeDeals,
                totalBookings,
                redemptionRate: `${redemptionRate}%`,
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

    let cuisineType = data.cuisineType;
    if (cuisineType && typeof cuisineType === "string") {
        try {
            data.cuisineType = JSON.parse(cuisineType);
        } catch (error) {
            data.cuisineType = cuisineType.split(",").map((c: string) => c.trim().toUpperCase());
        }
    }

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

    const restaurant = await RestaurantModel.findOneAndUpdate({ _id: id, restaurantOwner: ownerId }, { $set: data }, { returnDocument: 'after', runValidators: true }).populate("restaurantOwner", "name email phone");

    return restaurant;
};

const deleteRestaurant = async (id: string, ownerId: string) => {
    const restaurant = await RestaurantModel.findOneAndDelete({ _id: id, restaurantOwner: ownerId });
    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found or not authorized");
    return { message: "Restaurant deleted successfully" };
};

const approveRestaurant = async (id: string, approvedBy: string) => {
    const restaurant = await RestaurantModel.findByIdAndUpdate(id, { $set: { approved: true, approvedBy, approvedAt: new Date() } }, { returnDocument: 'after', runValidators: true }).populate("restaurantOwner", "name email phone");

    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    return restaurant;
};

const revokeRestaurantApproval = async (id: string) => {
    const restaurant = await RestaurantModel.findByIdAndUpdate(id, { $set: { approved: false, approvedBy: null, approvedAt: undefined } }, { returnDocument: 'after', runValidators: true }).populate("restaurantOwner", "name email phone");

    if (!restaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    return restaurant;
};

const updateRestaurantByAdmin = async (id: string, data: any, adminId: string) => {
    const existingRestaurant = await RestaurantModel.findById(id);
    if (!existingRestaurant) throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");

    let cuisineType = data.cuisineType;
    if (cuisineType && typeof cuisineType === "string") {
        try {
            data.cuisineType = JSON.parse(cuisineType);
        } catch (error) {
            data.cuisineType = cuisineType.split(",").map((c: string) => c.trim().toUpperCase());
        }
    }

    let address = data.restaurantAddress;
    if (address) {
        if (typeof address === "string") {
            try {
                address = JSON.parse(address);
            } catch (error) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid restaurant address format");
            }
        }

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

    if (Array.isArray(data.restaurantOpenHours)) {
        data.restaurantOpenHours = data.restaurantOpenHours.map((hour: any) => {
            if (!hour.isOpen || !Array.isArray(hour.slots) || hour.slots.length === 0) {
                return hour;
            }
            const lunch = hour.slots.find((s: any) => s.type === "LUNCH");
            const dinner = hour.slots.find((s: any) => s.type === "DINNER");

            hour.openTime = lunch ? lunch.openTime : hour.slots[0].openTime;
            hour.closeTime = dinner ? dinner.closeTime : lunch ? lunch.closeTime : hour.slots[hour.slots.length - 1].closeTime;

            return hour;
        });
    }

    if (data.approved !== undefined) {
        const approvedBool = data.approved === true || data.approved === "true";
        data.approved = approvedBool;
        if (approvedBool) {
            data.approvedBy = adminId;
            data.approvedAt = new Date();
        } else {
            data.approvedBy = null;
            data.approvedAt = null;
        }
    }

    const restaurant = await RestaurantModel.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
    ).populate("restaurantOwner", "name email phone");

    return restaurant;
};

const getPendingRestaurantsForAdmin = async (filters: any = {}) => {
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = { approved: false };

    const [restaurants, total] = await Promise.all([
        RestaurantModel.find(query)
            .select("restaurantName restaurantDescription restaurantImage cuisineType restaurantType createdAt restaurantOwner")
            .populate("restaurantOwner", "name email phone profileImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        RestaurantModel.countDocuments(query),
    ]);

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

const getRestaurantMapPoints = async (filters: any = {}) => {
    let query: any = { approved: true };

    // Apply basic filters if provided
    if (filters.cuisineType) {
        if (typeof filters.cuisineType === "string") {
            const cuisines = filters.cuisineType.split(",").map((c: string) => c.trim().toUpperCase());
            query.cuisineType = { $in: cuisines };
        } else if (Array.isArray(filters.cuisineType)) {
            query.cuisineType = { $in: filters.cuisineType };
        }
    }
    if (filters.restaurantType) {
        query.restaurantType = filters.restaurantType;
    }
    if (filters.search) {
        query.$or = [
            { restaurantName: { $regex: filters.search, $options: "i" } },
            { restaurantDescription: { $regex: filters.search, $options: "i" } }
        ];
    }

    const selectFields = "restaurantName restaurantDescription restaurantImage restaurantType cuisineType restaurantAddress.location restaurantAddress.street restaurantAddress.city";

    const hasBoundingBox = filters.neLat && filters.neLng && filters.swLat && filters.swLng;
    let restaurants: any[] = [];

    // 1. Try bounding box query if parameters are passed
    if (hasBoundingBox) {
        const neLat = parseFloat(filters.neLat as string);
        const neLng = parseFloat(filters.neLng as string);
        const swLat = parseFloat(filters.swLat as string);
        const swLng = parseFloat(filters.swLng as string);

        if (!isNaN(neLat) && !isNaN(neLng) && !isNaN(swLat) && !isNaN(swLng)) {
            const boxQuery = {
                ...query,
                "restaurantAddress.location": {
                    $geoWithin: {
                        $box: [
                            [swLng, swLat], // sw (lng, lat)
                            [neLng, neLat], // ne (lng, lat)
                        ],
                    },
                },
            };
            restaurants = await RestaurantModel.find(boxQuery).select(selectFields).limit(200);
        }
    }

    // 2. Fallback: If no bounding box was provided OR it returned empty, fallback to "nearest restaurants"
    if (restaurants.length === 0) {
        let centerLat: number | null = null;
        let centerLng: number | null = null;

        if (filters.lat && filters.lng) {
            centerLat = parseFloat(filters.lat as string);
            centerLng = parseFloat(filters.lng as string);
        } else if (hasBoundingBox) {
            const neLat = parseFloat(filters.neLat as string);
            const neLng = parseFloat(filters.neLng as string);
            const swLat = parseFloat(filters.swLat as string);
            const swLng = parseFloat(filters.swLng as string);

            if (!isNaN(neLat) && !isNaN(neLng) && !isNaN(swLat) && !isNaN(swLng)) {
                centerLat = (neLat + swLat) / 2;
                centerLng = (neLng + swLng) / 2;
            }
        }

        // If we have valid coordinates, retrieve nearest restaurants
        if (centerLat !== null && centerLng !== null && !isNaN(centerLat) && !isNaN(centerLng)) {
            const nearQuery = {
                ...query,
                "restaurantAddress.location": {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [centerLng, centerLat],
                        },
                    },
                },
            };
            restaurants = await RestaurantModel.find(nearQuery).select(selectFields).limit(30);
        } else {
            // 3. Absolute Fallback: No coordinates whatsoever, just return some approved restaurants
            restaurants = await RestaurantModel.find(query).select(selectFields).limit(30);
        }
    }

    return restaurants;
};

export const restaurantServices = {
    getAllRestaurants,
    getAllRestaurantsForAdmin,
    getRestaurantById,
    getRestaurantByOwner,
    updateRestaurant,
    deleteRestaurant,
    approveRestaurant,
    revokeRestaurantApproval,
    updateRestaurantByAdmin,
    getPendingRestaurantsForAdmin,
    getRestaurantMapPoints,
};
