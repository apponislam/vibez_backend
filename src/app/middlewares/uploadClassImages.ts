import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

// Upload folder
const classImagesDir = path.join(process.cwd(), "uploads", "class-images");
if (!fs.existsSync(classImagesDir)) fs.mkdirSync(classImagesDir, { recursive: true });

// Multer memory storage
const storage = multer.memoryStorage();
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Class images must be JPG, PNG, or WEBP"));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Generate unique filename
const generateFileName = (originalName: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    return `class-${timestamp}-${randomNum}.webp`;
};

// Middleware
export const uploadClassImages = (fieldName = "images", maxCount = 5) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const uploadMultiple = upload.array(fieldName, maxCount);

        uploadMultiple(req, res, async (err) => {
            if (err) return next(err);

            if (req.files && Array.isArray(req.files)) {
                const processedFiles: string[] = [];

                for (const file of req.files as Express.Multer.File[]) {
                    const newName = generateFileName(file.originalname);
                    const outputPath = path.join(classImagesDir, newName);

                    await sharp(file.buffer).resize({ width: 1080 }).webp({ quality: 80 }).toFile(outputPath);

                    processedFiles.push(`/uploads/class-images/${newName}`); // <- relative path
                }

                (req as any).savedClassImages = processedFiles;
            }

            next();
        });
    };
};
