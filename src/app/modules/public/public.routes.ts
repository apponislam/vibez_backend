import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { publicControllers } from "./public.controllers";

const router = Router();

// Public routes — anyone can read policies
router.get("/", publicControllers.getAllPolicies);
router.get("/:type", publicControllers.getPolicyByType);

// Admin-only routes — create/update/delete policies
router.post("/", auth, authorize(["ADMIN", "SUPER_ADMIN"]), publicControllers.upsertPolicy);
router.delete("/:type", auth, authorize(["ADMIN", "SUPER_ADMIN"]), publicControllers.deletePolicy);

export const publicRoutes = router;
