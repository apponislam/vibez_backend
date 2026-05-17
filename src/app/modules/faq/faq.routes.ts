import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { faqControllers } from "./faq.controllers";

const router = Router();

// Public routes
router.get("/", faqControllers.getActiveFAQs);
router.get("/:faqId", faqControllers.getFAQById);

// Admin-only routes
router.post("/", auth, authorize(["ADMIN", "SUPER_ADMIN"]), faqControllers.createFAQ);
router.get("/admin/all", auth, authorize(["ADMIN", "SUPER_ADMIN"]), faqControllers.getAllFAQs);
router.patch("/:faqId", auth, authorize(["ADMIN", "SUPER_ADMIN"]), faqControllers.updateFAQ);
router.patch("/:faqId/toggle-status", auth, authorize(["ADMIN", "SUPER_ADMIN"]), faqControllers.toggleFAQStatus);
router.delete("/:faqId", auth, authorize(["ADMIN", "SUPER_ADMIN"]), faqControllers.deleteFAQ);

export const faqRoutes = router;
