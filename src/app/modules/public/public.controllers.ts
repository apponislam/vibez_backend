import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { publicServices } from "./public.services";
import { PolicyTypeEnum } from "./public.interface";

const upsertPolicy = catchAsync(async (req: Request, res: Response) => {
    const { type, title, content, publishedAt } = req.body;
    const result = await publicServices.upsertPolicy(type, title, content, publishedAt);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policy saved successfully",
        data: result,
    });
});

const getAllPolicies = catchAsync(async (req: Request, res: Response) => {
    const result = await publicServices.getAllPolicies();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policies retrieved successfully",
        data: result,
    });
});

const getPolicyByType = catchAsync(async (req: Request, res: Response) => {
    const type = req.params.type as PolicyTypeEnum;
    const result = await publicServices.getPolicyByType(type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policy retrieved successfully",
        data: result,
    });
});

const deletePolicy = catchAsync(async (req: Request, res: Response) => {
    const type = req.params.type as PolicyTypeEnum;
    await publicServices.deletePolicy(type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policy deleted successfully",
        data: null,
    });
});

export const publicControllers = {
    upsertPolicy,
    getAllPolicies,
    getPolicyByType,
    deletePolicy,
};
