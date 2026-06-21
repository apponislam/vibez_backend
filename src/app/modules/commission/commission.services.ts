import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { CommissionModel } from "./commission.model";
import { ICommission } from "./commission.interface";

const createCommission = async (userId: string, data: Partial<ICommission>) => {
    const commission = await CommissionModel.create({
        ...data,
        createdBy: new Types.ObjectId(userId),
    });
    return commission;
};

const getAllCommissions = async () => {
    const commissions = await CommissionModel.find({ isDeleted: false }).sort({ createdAt: -1 });
    return commissions;
};

const getCommissionById = async (id: string) => {
    const commission = await CommissionModel.findOne({ _id: id, isDeleted: false });
    if (!commission) throw new ApiError(httpStatus.NOT_FOUND, "Commission not found");
    return commission;
};

const updateCommission = async (id: string, data: Partial<ICommission>) => {
    const commission = await CommissionModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    );
    if (!commission) throw new ApiError(httpStatus.NOT_FOUND, "Commission not found");
    return commission;
};

const deleteCommission = async (id: string) => {
    const commission = await CommissionModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    );
    if (!commission) throw new ApiError(httpStatus.NOT_FOUND, "Commission not found");
    return { message: "Commission deleted successfully" };
};

export const commissionServices = {
    createCommission,
    getAllCommissions,
    getCommissionById,
    updateCommission,
    deleteCommission,
};
