import { NextFunction, Request, Response } from "express";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, "You must be logged in to access this resource."));
        }

        const userRole = req.user.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            return next(new ApiError(httpStatus.FORBIDDEN, "You are not authorized to access this resource."));
        }

        next();
    };
};

export default authorize;
