import { sendMail } from "./nodemailer";

export const sendVerificationEmail = (email: string, name: string, verificationUrl: string, otp?: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p style="color: #666;">Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #999; font-size: 12px;">Or copy this link: ${verificationUrl}</p>
            ${
                otp
                    ? `<p style="color: #666; font-size: 16px; text-align: center; margin-top: 20px;">Or enter this 6-digit code in the app: <strong>${otp}</strong></p>
                       <p style="color: #999; font-size: 12px; text-align: center;">OTP expires in 10 minutes.</p>`
                    : ""
            }
            <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
    `;
    sendMail(email, "Verify Your Email", html);
};

export const sendOtpEmail = (email: string, otp: string, name?: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">${name ? `Hello ${name},` : "Hello,"}</h2>
            <p style="color: #666;">Your OTP code is:</p>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                ${otp}
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes.</p>
        </div>
    `;
    sendMail(email, "Your OTP Code", html);
};

export const sendWelcomeEmail = (email: string, name: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Welcome ${name}!</h2>
            <p style="color: #666;">Thank you for registering. Please verify your email to get started.</p>
        </div>
    `;
    sendMail(email, "Welcome to Our Platform", html);
};

export const sendEmailUpdateVerification = (email: string, name: string, verificationUrl: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p style="color: #666;">Please verify your new email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify New Email</a>
            </div>
            <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
    `;
    sendMail(email, "Verify Your New Email", html);
};

export const sendZoomMeetingInvitation = (email: string, name: string, topic: string, meetingId: string, joinUrl: string, startTime: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #2D8CFF; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Zoom Meeting Invitation</h1>
            </div>
            <div style="padding: 30px; color: #333333; line-height: 1.6;">
                <h2 style="color: #2D8CFF; margin-top: 0;">Hello ${name},</h2>
                <p style="font-size: 16px;">You have been invited to join a Zoom meeting for the class: <strong>${topic}</strong>.</p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #2D8CFF; padding: 15px; margin: 25px 0;">
                    <p style="margin: 5px 0;"><strong>Topic:</strong> ${topic}</p>
                    <p style="margin: 5px 0;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Meeting ID:</strong> ${meetingId}</p>
                </div>

                <div style="text-align: center; margin: 35px 0;">
                    <a href="${joinUrl}" style="background-color: #2D8CFF; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(45, 140, 255, 0.2);">Join Meeting</a>
                </div>

                <p style="font-size: 14px; color: #666666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="font-size: 12px; word-break: break-all; color: #2D8CFF;">${joinUrl}</p>
                
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999999; text-align: center;">Please make sure you have Zoom installed on your device before the meeting starts.</p>
            </div>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777777;">
                &copy; ${new Date().getFullYear()} lolfortnite650. All rights reserved.
            </div>
        </div>
    `;
    sendMail(email, `Meeting Invitation: ${topic}`, html);
};
