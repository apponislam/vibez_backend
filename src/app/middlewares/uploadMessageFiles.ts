import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

// Ensure message uploads directory exists
const messageUploadsDir = path.join(process.cwd(), "uploads", "message-files");
if (!fs.existsSync(messageUploadsDir)) fs.mkdirSync(messageUploadsDir, { recursive: true });

// Multer memory storage (needed for sharp processing)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// Helper to generate unique filename
const generateFileName = (originalName: string, prefix = "msg") => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    const nameWithoutExt = path.parse(originalName).name.replace(/\s+/g, "-");
    return `${prefix}-${nameWithoutExt}-${timestamp}-${randomNum}`;
};

// Middleware for multiple message files upload with sharp optimization
export const uploadMessageFiles = (req: Request, res: Response, next: NextFunction) => {
    const uploadFiles = upload.array("files", 10);

    uploadFiles(req, res, async (err) => {
        if (err) return next(err);

        if (req.files && Array.isArray(req.files)) {
            try {
                const files = req.files as Express.Multer.File[];
                const processedFiles = [];

                for (const file of files) {
                    const isImage = file.mimetype.startsWith("image/");
                    const fileName = generateFileName(file.originalname);

                    let finalFileName = file.originalname;
                    let finalMimeType = file.mimetype;
                    let finalPath = "";

                    if (isImage) {
                        // Process main image: Convert to webp and optimize
                        finalFileName = `${fileName}.webp`;
                        finalMimeType = "image/webp";
                        const outputPath = path.join(messageUploadsDir, finalFileName);

                        await sharp(file.buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(outputPath);

                        finalPath = `/uploads/message-files/${finalFileName}`;
                    } else {
                        // Non-image files: Just save to disk
                        const extension = path.extname(file.originalname);
                        finalFileName = `${fileName}${extension}`;
                        const outputPath = path.join(messageUploadsDir, finalFileName);

                        fs.writeFileSync(outputPath, file.buffer);
                        finalPath = `/uploads/message-files/${finalFileName}`;
                    }

                    processedFiles.push({
                        url: finalPath,
                        fileName: file.originalname,
                        fileSize: file.size,
                        mimeType: finalMimeType,
                    });
                }

                req.body.files = processedFiles;
                next();
            } catch (error) {
                next(error);
            }
        } else {
            next();
        }
    });
};
