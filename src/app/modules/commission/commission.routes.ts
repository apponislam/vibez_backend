import { Router } from "express";
import { commissionControllers } from "./commission.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Admin-only commission management routes
router.get("/", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.getAllCommissions);
router.get("/stats", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.getMonthlyCommissionStats);
router.get("/:id", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.getCommissionById);
router.patch("/:id", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.updateCommission);

export const commissionRoutes = router;
