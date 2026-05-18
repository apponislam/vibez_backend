import express from "express";
import { promoCodeControllers } from "./promocodes.controllers";

const router = express.Router();

router.post("/", promoCodeControllers.createPromoCode);
router.get("/", promoCodeControllers.getAllPromoCodes);
router.get("/:id", promoCodeControllers.getPromoCodeById);
router.get("/code/:code", promoCodeControllers.getPromoCodeByCode);
router.patch("/:id", promoCodeControllers.updatePromoCode);
router.delete("/:id", promoCodeControllers.deletePromoCode);
router.post("/use", promoCodeControllers.usePromoCode);

export const promoCodeRoutes = router;
