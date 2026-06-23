import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { dealControllers } from "./deal.controllers";

const router = Router();

// Public routes
router.get("/", dealControllers.getActiveDeals);
router.get("/:dealId", dealControllers.getDealById);

// Admin & Restaurant Owner routes
router.post("/", auth, authorize(["ADMIN", "SUPER_ADMIN", "RESTAURANT_OWNER"]), dealControllers.createDeal);
router.get("/admin/all", auth, authorize(["ADMIN", "SUPER_ADMIN"]), dealControllers.getAllDeals);
router.patch("/:dealId", auth, authorize(["ADMIN", "SUPER_ADMIN"]), dealControllers.updateDeal);
router.patch("/:dealId/toggle-status", auth, authorize(["ADMIN", "SUPER_ADMIN"]), dealControllers.toggleDealStatus);
router.delete("/:dealId", auth, authorize(["ADMIN", "SUPER_ADMIN"]), dealControllers.deleteDeal);

export const dealRoutes = router;
