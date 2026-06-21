import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { CommissionModel } from "./commission.model";
import { ICommission } from "./commission.interface";

const populateOptions = [
    { path: "commissionUser", select: "name email" },
    { path: "commissionFrom", select: "name email" },
];

const getAllCommissions = async (query: any = {}) => {
    const filter: any = {};
    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }
    if (query.commissionUser) {
        filter.commissionUser = query.commissionUser;
    }
    if (query.commissionFrom) {
        filter.commissionFrom = query.commissionFrom;
    }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
        CommissionModel.find(filter)
            .populate(populateOptions)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        CommissionModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: commissions,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const getCommissionById = async (id: string) => {
    const commission = await CommissionModel.findById(id).populate(populateOptions);
    if (!commission) throw new ApiError(httpStatus.NOT_FOUND, "Commission not found");
    return commission;
};

const updateCommission = async (id: string, data: Partial<ICommission>) => {
    const commission = await CommissionModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    ).populate(populateOptions);
    if (!commission) throw new ApiError(httpStatus.NOT_FOUND, "Commission not found");
    return commission;
};

const getMonthlyCommissionStats = async () => {
    const stats = await CommissionModel.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
                totalMaxPayout: { $sum: "$maxPayout" },
                avgPercentage: { $avg: "$commissionPercentage" },
            },
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                count: 1,
                totalMaxPayout: 1,
                avgPercentage: 1,
            },
        },
        {
            $sort: { year: -1, month: -1 },
        },
    ]);
    return stats;
};

export const commissionServices = {
    getAllCommissions,
    getCommissionById,
    updateCommission,
    getMonthlyCommissionStats,
};
