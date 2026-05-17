import nodemailer from "nodemailer";
import config from "../app/config";

const transporter = nodemailer.createTransport({
    host: config.mail.smtp_host,
    port: Number(config.mail.smtp_port),
    secure: config.mail.smtp_secure === "true",
    auth: {
        user: config.mail.smtp_user,
        pass: config.mail.smtp_pass,
    },
} as nodemailer.TransportOptions);

export const sendMail = (to: string | string[], subject: string, html: string, from?: string) => {
    const mailOptions = {
        from: from || config.mail.smtp_user,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
    };

    // return transporter.sendMail(mailOptions);
    // Process in background
    transporter.sendMail(mailOptions).catch((error: any) => {
        console.error("Email error:", error);
    });
};
