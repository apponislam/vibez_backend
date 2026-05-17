import { Server, Socket } from "socket.io";
import http from "http";

let io: Server;

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

    io.on("connection", (socket: Socket) => {
        // console.log(socket);
        console.log("🔌 Socket connected:", socket.id);

        const userId = socket.handshake.auth?._id;

        if (userId) {
            socket.join(`user_${userId}`);
            console.log("User joined room:", userId);
        }

        /*
        ------------------------------------------------
        Register Global Events Here
        ------------------------------------------------
        */

        socket.on("ping", () => {
            socket.emit("pong", "pong");
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
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
