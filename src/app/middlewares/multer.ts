import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

// Ensure upload directories exist
const profileImageDir = path.join(process.cwd(), "uploads", "profile-images");
if (!fs.existsSync(profileImageDir)) fs.mkdirSync(profileImageDir, { recursive: true });

const reviewImageDir = path.join(process.cwd(), "uploads", "review-images");
if (!fs.existsSync(reviewImageDir)) fs.mkdirSync(reviewImageDir, { recursive: true });

const shortsDir = path.join(process.cwd(), "uploads", "shorts");
if (!fs.existsSync(shortsDir)) fs.mkdirSync(shortsDir, { recursive: true });

// Multer memory storage
const storage = multer.memoryStorage();

// File filter for images
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Image must be JPG, PNG, or WEBP"));
};

// File filter for videos
const videoFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Video must be MP4, WEBM, or MOV"));
};

// Multer setup for images
const imageUpload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
});

// Multer setup for videos
const videoUpload = multer({
    storage,
    fileFilter: videoFileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit per video
});

// Helper to generate unique filename for images
const generateImageFileName = (prefix: string, originalName: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${randomNum}.webp`;
};

// Helper to generate unique filename for videos
const generateVideoFileName = (prefix: string, originalName: string) => {
    const ext = path.extname(originalName) || ".mp4";
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${randomNum}${ext}`;
};

// Middleware for single profile image upload
export const uploadProfileImage = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = imageUpload.single("profileImage");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process profileImage file if uploaded
        if (req.file) {
            try {
                const file = req.file;
                const newName = generateImageFileName("profile", file.originalname);
                const outputPath = path.join(profileImageDir, newName);

                // Convert to webp
                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                file.filename = newName;
                file.path = outputPath;
                file.mimetype = "image/webp";
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for multiple review images upload (up to 10 images)
export const uploadReviewImages = (req: Request, res: Response, next: NextFunction) => {
    const uploadMultiple = imageUpload.array("reviewImages", 10); // Max 10 images

    uploadMultiple(req, res, async (err) => {
        if (err) return next(err);

        // Process review images if uploaded
        if (req.files && Array.isArray(req.files)) {
            try {
                const processedFiles: string[] = [];

                for (const file of req.files) {
                    const newName = generateImageFileName("review", file.originalname);
                    const outputPath = path.join(reviewImageDir, newName);

                    // Convert to webp
                    await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                    processedFiles.push(newName);
                }

                // Add processed filenames to request body
                req.body.images = processedFiles;
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for shorts upload
export const uploadShorts = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = videoUpload.single("short");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process short if uploaded
        if (req.file) {
            try {
                const file = req.file;
                const newName = generateVideoFileName("shorts", file.originalname);
                const outputPath = path.join(shortsDir, newName);

                // Write video to disk (no conversion for now)
                fs.writeFileSync(outputPath, file.buffer);

                file.filename = newName;
                file.path = outputPath;

                // Add short URL to request body
                req.body.shortUrl = `/uploads/shorts/${newName}`;
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Ensure restaurant images directory exists
const restaurantImageDir = path.join(process.cwd(), "uploads", "restaurant-images");
if (!fs.existsSync(restaurantImageDir)) fs.mkdirSync(restaurantImageDir, { recursive: true });

// Middleware for restaurant registration (profile image + restaurant image)
export const uploadRestaurantRegistration = (req: Request, res: Response, next: NextFunction) => {
    const uploadFields = imageUpload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "restaurantImage", maxCount: 1 },
    ]);

    uploadFields(req, res, async (err) => {
        if (err) return next(err);

        // Process profileImage
        if (req.files && !Array.isArray(req.files) && req.files["profileImage"]) {
            try {
                const file = req.files["profileImage"][0];
                const newName = generateImageFileName("profile", file.originalname);
                const outputPath = path.join(profileImageDir, newName);

                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                req.body.profileImage = `/uploads/profile-images/${newName}`;
            } catch (error) {
                return next(error);
            }
        }

        // Process restaurantImage
        if (req.files && !Array.isArray(req.files) && req.files["restaurantImage"]) {
            try {
                const file = req.files["restaurantImage"][0];
                const newName = generateImageFileName("restaurant", file.originalname);
                const outputPath = path.join(restaurantImageDir, newName);

                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                req.body.restaurantImage = `/uploads/restaurant-images/${newName}`;
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for single restaurant image upload
export const uploadRestaurantImage = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = imageUpload.single("restaurantImage");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        if (req.file) {
            try {
                const file = req.file;
                const newName = generateImageFileName("restaurant", file.originalname);
                const outputPath = path.join(restaurantImageDir, newName);

                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                req.body.restaurantImage = `/uploads/restaurant-images/${newName}`;
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};
