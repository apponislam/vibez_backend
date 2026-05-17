import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PolicyTypeEnum } from "./public.interface";
import { PolicyModel } from "./public.model";

const upsertPolicy = async (type: PolicyTypeEnum, title: string, content: string, publishedAt?: Date) => {
    const policy = await PolicyModel.findOneAndUpdate({ type }, { $set: { title, content, publishedAt: publishedAt ?? new Date(), isDeleted: false } }, { returnDocument: "after", upsert: true, runValidators: true });
    return policy;
};

const getAllPolicies = async () => {
    const policies = await PolicyModel.find({ isDeleted: false }).sort({ type: 1 });
    return policies;
};

const getPolicyByType = async (type: PolicyTypeEnum) => {
    const policy = await PolicyModel.findOne({ type, isDeleted: false });
    if (!policy) throw new ApiError(httpStatus.NOT_FOUND, "Policy not found");
    return policy;
};

const deletePolicy = async (type: PolicyTypeEnum) => {
    const policy = await PolicyModel.findOneAndUpdate({ type, isDeleted: false }, { $set: { isDeleted: true } }, { returnDocument: "after" });
    if (!policy) throw new ApiError(httpStatus.NOT_FOUND, "Policy not found");
    return policy;
};

export const publicServices = {
    upsertPolicy,
    getAllPolicies,
    getPolicyByType,
    deletePolicy,
};
