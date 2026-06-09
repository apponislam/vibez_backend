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

// Multer memory storage
const storage = multer.memoryStorage();

// File filter (only allow images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Image must be JPG, PNG, or WEBP"));
};

// Multer setup
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// Helper to generate unique filename
const generateFileName = (prefix: string, originalName: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${randomNum}.webp`;
};

// Middleware for single profile image upload
export const uploadProfileImage = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single("profileImage");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process profileImage file if uploaded
        if (req.file) {
            try {
                const file = req.file;
                const newName = generateFileName("profile", file.originalname);
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
    const uploadMultiple = upload.array("reviewImages", 10); // Max 10 images

    uploadMultiple(req, res, async (err) => {
        if (err) return next(err);

        // Process review images if uploaded
        if (req.files && Array.isArray(req.files)) {
            try {
                const processedFiles: string[] = [];

                for (const file of req.files) {
                    const newName = generateFileName("review", file.originalname);
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
