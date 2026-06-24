import { Router } from "express";
import auth from "../../middlewares/auth";
import checkAuth from "../../middlewares/checkAuth";
import { uploadShorts } from "../../middlewares/multer";
import { shortsControllers } from "./shorts.controllers";

const router = Router();

// Public routes
router.get("/random", checkAuth, shortsControllers.getRandomShorts);
router.get("/restaurant/:restaurantId", shortsControllers.getShortsByRestaurant);

// Authenticated routes for restaurant owners
router.get("/my-short", auth, shortsControllers.getMyShorts);
router.post("/upload", auth, uploadShorts, shortsControllers.uploadShorts);
router.delete("/", auth, shortsControllers.deleteShorts);

export const shortsRoutes = router;
