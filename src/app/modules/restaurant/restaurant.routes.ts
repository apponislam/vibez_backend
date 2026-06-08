import { Router } from "express";
import { restaurantControllers } from "./restaurant.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Public routes
router.get("/", restaurantControllers.getAllRestaurants);
router.get("/:id", restaurantControllers.getRestaurantById);

// Protected routes (require auth)
router.get("/my/restaurant", auth, restaurantControllers.getMyRestaurant);
router.post("/", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), restaurantControllers.createRestaurant);
router.patch("/:id", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), restaurantControllers.updateRestaurant);
router.delete("/:id", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), restaurantControllers.deleteRestaurant);

export const restaurantRoutes = router;
