import { Router } from "express";
import { commissionControllers } from "./commission.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Admin-only commission management routes
router.post("/", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.createCommission);
router.get("/", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.getAllCommissions);
router.get("/:id", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.getCommissionById);
router.patch("/:id", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.updateCommission);
router.delete("/:id", auth, authorize(["ADMIN", "SUPER_ADMIN"]), commissionControllers.deleteCommission);

export const commissionRoutes = router;
