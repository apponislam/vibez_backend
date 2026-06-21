import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { WithdrawModel } from "./withdraw.model";
import { IWithdraw, WithdrawStatus, WithdrawPaymentMethod } from "./withdraw.interface";
import { stripeServices } from "../stripe/stripe.service";
import config from "../../config";

// Create or retrieve onboarding link for Stripe Connected Account
const createConnectAccount = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    let accountId = user.stripeConnectedAccountId;

    if (!accountId) {
        // Create an Express connected account
        const account = await stripeServices.stripe.accounts.create({
            type: "express",
            email: user.email,
            capabilities: {
                transfers: { requested: true },
            },
        });
        accountId = account.id;

        // Save connected account ID to the user document
        await UserModel.findByIdAndUpdate(userId, {
            $set: { stripeConnectedAccountId: accountId },
        });
    }

    // Create onboarding link
    const accountLink = await stripeServices.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${config.client_url}/withdraw/onboarding-refresh`,
        return_url: `${config.client_url}/withdraw/onboarding-complete`,
        type: "account_onboarding",
    });

    return {
        stripeConnectedAccountId: accountId,
        url: accountLink.url,
    };
};

// Request a withdrawal (holds the balance)
const requestWithdrawal = async (userId: string, data: Partial<IWithdraw>) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid withdrawal amount");
    }

    // Check balance
    const currentBalance = user.balance || 0;
    if (currentBalance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient balance");
    }

    // If using Stripe, make sure the user has onboarded their connected account
    if (data.paymentMethod === WithdrawPaymentMethod.STRIPE) {
        if (!user.stripeConnectedAccountId) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Please connect your Stripe account before requesting a withdrawal"
            );
        }
    }

    // Deduct the requested amount from user balance
    await UserModel.findByIdAndUpdate(userId, {
        $inc: { balance: -amount },
    });

    // Create the withdraw record
    const withdrawal = await WithdrawModel.create({
        userId,
        amount,
        paymentMethod: data.paymentMethod,
        paymentDetails: data.paymentDetails || {},
        status: WithdrawStatus.PENDING,
    });

    return withdrawal;
};

// Approve withdrawal (transfers via Stripe Connect if applicable)
const approveWithdrawal = async (withdrawId: string) => {
    const withdrawal = await WithdrawModel.findById(withdrawId);
    if (!withdrawal) throw new ApiError(httpStatus.NOT_FOUND, "Withdrawal request not found");

    if (withdrawal.status !== WithdrawStatus.PENDING) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Withdrawal is already processed");
    }

    const user = await UserModel.findById(withdrawal.userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User associated with withdrawal not found");

    let stripeTransferId;

    if (withdrawal.paymentMethod === WithdrawPaymentMethod.STRIPE) {
        if (!user.stripeConnectedAccountId) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "User has not set up a Stripe Connected Account"
            );
        }

        try {
            // Initiate transfer to the connected Stripe account
            const transfer = await stripeServices.stripe.transfers.create({
                amount: Math.round(withdrawal.amount * 100), // Stripe expects cents
                currency: "chf",
                destination: user.stripeConnectedAccountId,
                description: `Withdrawal payout for user ID: ${user._id}`,
            });
            stripeTransferId = transfer.id;
        } catch (error: any) {
            // If transfer fails, log and throw API Error
            console.error("Stripe transfer failed:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Stripe transfer failed: ${error.message}`
            );
        }
    }

    // Mark as approved
    withdrawal.status = WithdrawStatus.APPROVED;
    if (stripeTransferId) {
        withdrawal.stripeTransferId = stripeTransferId;
    }
    await withdrawal.save();

    return withdrawal;
};

// Reject withdrawal (restores user balance)
const rejectWithdrawal = async (withdrawId: string, adminFeedback: string) => {
    const withdrawal = await WithdrawModel.findById(withdrawId);
    if (!withdrawal) throw new ApiError(httpStatus.NOT_FOUND, "Withdrawal request not found");

    if (withdrawal.status !== WithdrawStatus.PENDING) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Withdrawal is already processed");
    }

    // Add back the deducted amount to user balance
    await UserModel.findByIdAndUpdate(withdrawal.userId, {
        $inc: { balance: withdrawal.amount },
    });

    withdrawal.status = WithdrawStatus.REJECTED;
    withdrawal.adminFeedback = adminFeedback;
    await withdrawal.save();

    return withdrawal;
};

// Get withdrawals for a specific user
const getUserWithdrawals = async (userId: string) => {
    const withdrawals = await WithdrawModel.find({ userId }).sort({ createdAt: -1 });
    return withdrawals;
};

// Get all withdrawals (Admin view)
const getAllWithdrawals = async (filter: Record<string, any> = {}) => {
    const withdrawals = await WithdrawModel.find(filter)
        .populate("userId", "name email role image balance")
        .sort({ createdAt: -1 });
    return withdrawals;
};

export const withdrawServices = {
    createConnectAccount,
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
};
