import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { CommissionModel } from "./commission.model";
import { ICommission } from "./commission.interface";

const populateOptions = [
    { path: "commissionUser", select: "name email" },
    { path: "commissionFrom", select: "name email" },
];

const createCommission = async (data: Partial<ICommission>) => {
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    data.startDate = startDate;

    if (data.commissionDuration) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + Number(data.commissionDuration));
        data.endDate = endDate;
    }

    // Auto-generate commissionGetByMonth array and totalCount if not provided in the creation payload
    if (!data.commissionGetByMonth && data.commissionDuration && data.maxPayout) {
        const duration = Number(data.commissionDuration);
        const maxPayout = Number(data.maxPayout);
        const monthlyAmount = Number((maxPayout / duration).toFixed(2));
        
        const list = [];
        let remaining = maxPayout;
        for (let i = 1; i <= duration; i++) {
            // Distribute precisely (putting any division roundoff in the last month)
            const currentAmount = i === duration ? Number(remaining.toFixed(2)) : monthlyAmount;
            remaining -= currentAmount;

            list.push({
                count: i,
                commission: currentAmount,
                time: new Date(new Date(startDate).setMonth(startDate.getMonth() + i - 1)),
            });
        }
        data.totalCount = duration;
        data.commissionGetByMonth = list;
    }

    const commission = await CommissionModel.create(data);
    return commission.populate(populateOptions);
};

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
    createCommission, // Exposing internally for programmatic creations (e.g. triggers, webhooks)
    getAllCommissions,
    getCommissionById,
    updateCommission,
    getMonthlyCommissionStats,
};
