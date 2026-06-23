import { Router } from "express";
import auth from "../../middlewares/auth";
import { favoriteControllers } from "./favorite.controllers";

const router = Router();

// All favorite routes are authenticated
router.get("/", auth, favoriteControllers.getUserFavorites);
router.get("/count", auth, favoriteControllers.getFavoritesCount);
router.post("/toggle", auth, favoriteControllers.toggleFavorite);

export const favoriteRoutes = router;
