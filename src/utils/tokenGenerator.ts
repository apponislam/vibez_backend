import crypto from "crypto";

export const generateVerificationToken = (expiryHours = 24) => {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    return { token, expiry };
};

export const generateOtp = (length = 6, expiryMinutes = 5) => {
    const otp = crypto
        .randomInt(0, 10 ** length)
        .toString()
        .padStart(length, "0");
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { otp, expiry };
};
