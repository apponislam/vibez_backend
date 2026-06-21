import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { commissionServices } from "./commission.services";

const getAllCommissions = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.getAllCommissions(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Commissions retrieved successfully",
        meta: result.meta,
        data: result.data,
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

const getMonthlyCommissionStats = catchAsync(async (req: Request, res: Response) => {
    const result = await commissionServices.getMonthlyCommissionStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Monthly commission statistics retrieved successfully",
        data: result,
    });
});

export const commissionControllers = {
    getAllCommissions,
    getCommissionById,
    updateCommission,
    getMonthlyCommissionStats,
};
