import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../../utils/catchAsync";
import config from "../config";
import { UserModel } from "../modules/auth/auth.model";
import ApiError from "../../errors/ApiError";

const auth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;

    if (token?.startsWith("Bearer ")) token = token.slice(7);

    if (!token) {
        throw new ApiError(401, "Authentication failed: No token provided");
    }

    let decoded: jwt.JwtPayload;
    try {
        decoded = jwt.verify(token, config.jwt_access_secret as string) as { _id: string };
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            throw new ApiError(401, "Authentication failed: Token expired");
        }
        throw new ApiError(401, "Authentication failed: Invalid token");
    }

    const user = await UserModel.findOne({ _id: decoded._id });

    if (!user) {
        throw new ApiError(404, "Authentication failed: User not found");
    }

    if (!user.isActive) {
        throw new ApiError(401, "Authentication failed: Your account has been deactivated. Please contact support.");
    }

    if (user.role !== decoded?.role) {
        throw new ApiError(403, "Authentication failed: Role mismatch. Please login again.");
    }

    req.user = user;
    next();
});

export default auth;
