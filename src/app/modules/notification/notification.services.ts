import { NotificationModel } from "./notification.model";
import { INotification } from "./notification.interface";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";

const sendNotification = async (
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<INotification> => {
    const notification = await NotificationModel.create({
        userId,
        type,
        title,
        body,
        data,
    });
    return notification;
};

const getMyNotifications = async (userId: string): Promise<INotification[]> => {
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    return notifications;
};

const markAsRead = async (userId: string, notificationId: string): Promise<INotification> => {
    const notification = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { isRead: true } },
        { new: true }
    );
    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }
    return notification;
};

const markAllAsRead = async (userId: string): Promise<{ acknowledged: boolean; modifiedCount: number }> => {
    const result = await NotificationModel.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
    );
    return result;
};

export const notificationServices = {
    sendNotification,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
};
