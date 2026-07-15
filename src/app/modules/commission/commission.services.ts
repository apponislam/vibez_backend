import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { CommissionModel } from "./commission.model";
import { ICommission } from "./commission.interface";
import { UserModel } from "../auth/auth.model";
import { Types } from "mongoose";

const populateOptions = [
    { path: "commissionUser", select: "name email" },
    { path: "commissionFrom", select: "name email" },
];

const createCommission = async (data: Partial<ICommission>) => {
    const commission = await CommissionModel.create(data);
    return commission.populate(populateOptions);
};

const handleSubscriptionPayment = async (payload: {
    userId: string;
    referredBy: string;
    invoiceId: string;
    subscriptionId: string;
    invoiceAmount: number;
}) => {
    const { userId, referredBy, invoiceId, subscriptionId, invoiceAmount } = payload;

    // Find the referrer to get their commission configuration
    const referrer = await UserModel.findById(referredBy);
    if (!referrer) {
        throw new ApiError(httpStatus.NOT_FOUND, "Referrer user not found");
    }

    const commissionPercentage = referrer.commissionPercentage || 0;
    const maxPayout = referrer.maxPayout || 0;
    const commissionDuration = referrer.commissionDuration || 0;

    // Find or create the Commission document for this referred user
    let commission = await CommissionModel.findOne({
        commissionFrom: userId,
        commissionUser: referredBy,
    });

    if (!commission) {
        commission = await CommissionModel.create({
            commissionPercentage,
            maxPayout,
            commissionDuration,
            commissionPaidCount: 0,
            commissionUser: referredBy,
            commissionFrom: userId,
            subscriptionId,
            history: [],
            isActive: true,
        });
    } else if (commission.subscriptionId !== subscriptionId) {
        commission.subscriptionId = subscriptionId;
        await commission.save();
    }

    // Check if this invoice has already been processed to prevent double payout
    const isAlreadyProcessed = commission.history.some((h) => h.invoiceId === invoiceId);
    if (isAlreadyProcessed) {
        console.log(`Invoice ${invoiceId} has already been processed for commission.`);
        return commission;
    }

    // Calculate total already paid to this referred user
    const totalAlreadyPaid = commission.history.reduce((sum, h) => sum + h.amount, 0);
    const remainingLimit = Math.max(0, commission.maxPayout - totalAlreadyPaid);

    // Verify if paid count and remaining limit are not reached
    if (commission.commissionPaidCount < commission.commissionDuration && remainingLimit > 0) {
        const calculatedCommission = invoiceAmount * (commission.commissionPercentage / 100);
        const finalCommission = Number(Math.min(calculatedCommission, remainingLimit).toFixed(2));

        if (finalCommission > 0) {
            // Add history entry
            commission.history.push({
                invoiceId,
                amount: finalCommission,
                createdAt: new Date(),
            });

            // Increment paid count
            commission.commissionPaidCount += 1;
            await commission.save();

            // Increment referrer's balance
            await UserModel.findByIdAndUpdate(referredBy, {
                $inc: { balance: finalCommission },
            });

            console.log(`Commission of ${finalCommission} CHF credited to user ${referredBy} for invoice ${invoiceId}`);
        } else {
            console.log(`Calculated commission amount is 0 or remaining limit is reached.`);
        }
    } else {
        console.log(`Commission duration limit of ${commission.commissionDuration} or maxPayout limit of ${commission.maxPayout} reached for user ${userId}`);
    }

    return commission;
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
        { returnDocument: 'after', runValidators: true }
    ).populate(populateOptions);
    if (!commission) throw new ApiError(httpStatus.NOT_FOUND, "Commission not found");
    return commission;
};

const getMonthlyCommissionStats = async () => {
    const stats = await CommissionModel.aggregate([
        { $unwind: { path: "$history", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
                totalMaxPayout: { $sum: { $ifNull: ["$history.amount", 0] } },
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
    createCommission,
    handleSubscriptionPayment,
    getAllCommissions,
    getCommissionById,
    updateCommission,
    getMonthlyCommissionStats,
};
