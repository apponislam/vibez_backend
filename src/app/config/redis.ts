// redis ts
import { Redis } from "ioredis";
import mongoose from "mongoose";
import config from "./index";

export const redisConnection = new Redis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
});

redisConnection
    .ping()
    .then((res) => {
        console.log("🟢 Redis connected:", res);
    })
    .catch((err) => {
        console.error("🔴 Redis connection failed:", err.message);
    });

export const connectDB = async () => {
    try {
        await mongoose.connect(config.mongodb_url as string);

        console.log("🟢 MongoDB connected");
    } catch (err) {
        console.error("🔴 MongoDB connection failed:", err);
        process.exit(1);
    }
};
