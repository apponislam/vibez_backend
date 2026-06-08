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

export const ReservationModel = mongoose.model<IReservation>("Reservation", ReservationSchema);
