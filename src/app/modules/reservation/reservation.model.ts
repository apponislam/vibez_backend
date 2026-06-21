import mongoose, { Schema } from "mongoose";
import { IReservation, ReservationStatus } from "./reservation.interface";

const ReservationSchema = new Schema<IReservation>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: [true, "Restaurant is required"],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        dealId: {
            type: Schema.Types.ObjectId,
            ref: "Deal",
            required: [true, "Deal is required"],
        },
        partySize: {
            type: Number,
            required: [true, "Party size is required"],
            min: 1,
        },
        reservationDate: {
            type: Date,
            required: [true, "Reservation date is required"],
        },
        reservationTime: {
            type: String,
            required: [true, "Reservation time is required"],
        },
        specialRequests: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(ReservationStatus),
            default: ReservationStatus.UPCOMING,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for common query patterns
ReservationSchema.index({ dealId: 1, reservationDate: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ restaurantId: 1, reservationDate: 1, reservationTime: 1 });
ReservationSchema.index({ userId: 1, reservationDate: -1, reservationTime: -1 });


export const ReservationModel = mongoose.model<IReservation>("Reservation", ReservationSchema);
