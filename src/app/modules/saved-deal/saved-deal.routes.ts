import { Router } from "express";
import auth from "../../middlewares/auth";
import { savedDealControllers } from "./saved-deal.controllers";

const router = Router();

// All saved deal routes are authenticated
router.get("/", auth, savedDealControllers.getUserSavedDeals);
router.get("/count", auth, savedDealControllers.getSavedDealsCount);
router.post("/toggle", auth, savedDealControllers.toggleSavedDeal);

export const savedDealRoutes = router;
