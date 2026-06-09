import { Router } from "express";
import auth from "../../middlewares/auth";
import { savedDealControllers } from "./saved-deal.controllers";

const router = Router();

// All saved deal routes are authenticated
router.get("/", auth, savedDealControllers.getUserSavedDeals);
router.get("/check/:dealId", auth, savedDealControllers.checkIsSaved);
router.post("/", auth, savedDealControllers.saveDeal);
router.delete("/:dealId", auth, savedDealControllers.unsaveDeal);

export const savedDealRoutes = router;
