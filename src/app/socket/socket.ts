import { Server, Socket } from "socket.io";
import http from "http";
import { UserModel } from "../modules/auth/auth.model";
import { RestaurantModel } from "../modules/restaurant/restaurant.model";

let io: Server;

// Track online user connections: userId -> Set of socket.ids
export const onlineUsers = new Map<string, Set<string>>();

export const getOnlineUserIds = (): string[] => {
    return Array.from(onlineUsers.keys());
};

/*
|--------------------------------------------------------------------------
| Initialize Socket Server
|--------------------------------------------------------------------------
*/

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

    io.on("connection", async (socket: Socket) => {
        // console.log(socket);
        console.log("🔌 Socket connected:", socket.id);

        const userId = socket.handshake.auth?._id;

        if (userId) {
            socket.join(`user_${userId}`);
            console.log("User joined room:", userId);

            // Track online user
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId)!.add(socket.id);

            try {
                // Join restaurant room if owner or staff
                const user = await UserModel.findById(userId).lean();
                if (user) {
                    let restaurantId = user.restaurantId;
                    if (!restaurantId && user.role === "RESTAURANT_OWNER") {
                        const restaurant = await RestaurantModel.findOne({ restaurantOwner: userId }).lean();
                        if (restaurant) {
                            restaurantId = restaurant._id;
                        }
                    }
                    if (restaurantId) {
                        const restaurantRoom = `restaurant_${restaurantId.toString()}`;
                        socket.join(restaurantRoom);
                        console.log(`User ${userId} joined room ${restaurantRoom}`);

                        // Immediately send the initial stats to this socket
                        const { dashboardServices } = require("../modules/dashboard/dashboard.services");
                        const stats = await dashboardServices.getRestaurantRealtimeStatsById(restaurantId.toString());
                        socket.emit("restaurant_stats", stats);

                        // If user is STAFF, notify restaurant room that online staff count changed
                        if (user.role === "STAFF") {
                            await dashboardServices.broadcastRestaurantStats(restaurantId.toString());
                        }
                    }
                }
            } catch (err) {
                console.error("Error setting up restaurant socket room:", err);
            }
        }

        /*
        ------------------------------------------------
        Register Global Events Here
        ------------------------------------------------
        */

        socket.on("ping", () => {
            socket.emit("pong", "pong");
        });

        socket.on("disconnect", async () => {
            console.log("❌ Socket disconnected:", socket.id);
            if (userId && onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId)!;
                userSockets.delete(socket.id);
                const wasLastSocket = userSockets.size === 0;
                if (wasLastSocket) {
                    onlineUsers.delete(userId);
                }

                if (wasLastSocket) {
                    try {
                        const user = await UserModel.findById(userId).lean();
                        if (user && user.role === "STAFF") {
                            const restaurantId = user.restaurantId;
                            if (restaurantId) {
                                const { dashboardServices } = require("../modules/dashboard/dashboard.services");
                                await dashboardServices.broadcastRestaurantStats(restaurantId.toString());
                            }
                        }
                    } catch (err) {
                        console.error("Error handling socket disconnect stats broadcast:", err);
                    }
                }
            }
        });
    });

    return io;
};

/*
|--------------------------------------------------------------------------
| Get Socket Instance Anywhere
|--------------------------------------------------------------------------
*/

export const getSocket = () => {
    if (!io) {
        throw new Error("Socket not initialized");
    }

    return io;
};

/*
|--------------------------------------------------------------------------
| Emit to Multiple Users (Simple Helper)
|--------------------------------------------------------------------------
*/

export const sendToUsers = (userIds: any[], event: string, data: any) => {
    if (!io) return;
    const rooms = userIds.map((id) => `user_${id.toString()}`);
    io.to(rooms).emit(event, data);
};

export const sendToRoom = (roomId: string, event: string, data: any) => {
    if (!io) return;
    io.to(roomId).emit(event, data);
};
