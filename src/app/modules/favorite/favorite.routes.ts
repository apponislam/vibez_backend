import { Router } from "express";
import auth from "../../middlewares/auth";
import { favoriteControllers } from "./favorite.controllers";

const router = Router();

// All favorite routes are authenticated
router.get("/", auth, favoriteControllers.getUserFavorites);
router.get("/check/:restaurantId", auth, favoriteControllers.checkIsFavorite);
router.post("/", auth, favoriteControllers.addFavorite);
router.delete("/:restaurantId", auth, favoriteControllers.removeFavorite);

export const favoriteRoutes = router;
