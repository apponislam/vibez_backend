import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { commissionServices } from "./commission.services";

const createCommission = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.createCommission(req.user._id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Commission created successfully",
        data: result,
    });
});

const getAllCommissions = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.getAllCommissions();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Commissions retrieved successfully",
        data: result,
    });
});

const getCommissionById = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.getCommissionById(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Commission retrieved successfully",
        data: result,
    });
});

const updateCommission = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.updateCommission(req.params.id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Commission updated successfully",
        data: result,
    });
});

const deleteCommission = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.deleteCommission(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Commission deleted successfully",
        data: result,
    });
});

export const commissionControllers = {
    createCommission,
    getAllCommissions,
    getCommissionById,
    updateCommission,
    deleteCommission,
};
