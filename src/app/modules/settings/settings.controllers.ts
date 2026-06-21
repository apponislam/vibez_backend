import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { settingsServices } from "./settings.services";

const getSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await settingsServices.getSettings();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Settings retrieved successfully",
        data: result,
    });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await settingsServices.updateSettings(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Settings updated successfully",
        data: result,
    });
});

export const settingsControllers = {
    getSettings,
    updateSettings,
};
