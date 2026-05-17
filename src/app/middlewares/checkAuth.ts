import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../../utils/catchAsync";
import config from "../config";
import { UserModel } from "../modules/auth/auth.model";

/**
 * Middleware to extract user information from JWT token if present.
 * This will NOT throw an error if the token is missing, invalid, or expired.
 */
const checkAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;

    if (token?.startsWith("Bearer ")) token = token.slice(7);

    if (!token) {
        return next();
    }

    let decoded: jwt.JwtPayload;
    try {
        decoded = jwt.verify(token, config.jwt_access_secret as string) as { _id: string; role: string };
    } catch (err: any) {
        return next();
    }

    const user = await UserModel.findOne({ _id: decoded._id });

    if (user && user.isActive && user.role === decoded.role) {
        req.user = user;
    }

    next();
});

export default checkAuth;
