import { Router } from "express";
import { authControllers } from "./auth.controllers";
import auth from "../../middlewares/auth";
import { uploadProfileImage, uploadRestaurantRegistration } from "../../middlewares/multer";
const router = Router();

// Public routes
router.post("/register", uploadProfileImage, authControllers.register);
router.post("/register-restaurant", uploadRestaurantRegistration, authControllers.registerRestaurant);
router.post("/login", authControllers.login);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/resend-verification", authControllers.resendVerificationEmail);
router.post("/refresh-token", authControllers.refreshAccessToken);
router.post("/forgot-password", authControllers.requestPasswordReset);
router.post("/verify-otp", authControllers.verifyOtp);
router.post("/resend-otp", authControllers.resendOtp);
router.post("/reset-password", authControllers.resetPassword);

// Protected routes (require auth)
router.get("/me", auth, authControllers.getMe);
router.post("/logout", auth, authControllers.logout);
router.patch("/profile", auth, uploadProfileImage, authControllers.updateProfile);
router.patch("/location", auth, authControllers.updateLocation);
router.post("/fcm-token", auth, authControllers.addFcmToken);
router.post("/change-password", auth, authControllers.changePassword);
router.post("/update-email", auth, authControllers.updateEmail);
router.get("/verify-new-email", authControllers.verifyNewEmail);
router.post("/resend-email-update", auth, authControllers.resendEmailUpdate);

// Admin only routes
router.post("/set-password/:userId", auth, authControllers.setUserPassword);
router.patch("/users/:userId/approve", auth, authControllers.approveUser);
router.patch("/users/:userId/revoke-approval", auth, authControllers.revokeUserApproval);

export const authRoutes = router;
