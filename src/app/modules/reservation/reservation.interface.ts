import { Types } from "mongoose";

export enum ReservationStatus {
    UPCOMING = "UPCOMING",
    ARRIVED = "ARRIVED",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
}

export interface IReservation {
    restaurantId: Types.ObjectId;
    userId: Types.ObjectId;
    dealId: Types.ObjectId;
    partySize: number;
    reservationDate: Date;
    reservationTime: string;
    specialRequests?: string;
    status: ReservationStatus;
}
