import { Server } from "socket.io";

import { registerConnectionHandlers } from "../handlers/connection.handler.js";

let io = null;

export const initializeSocket = (server) => {

    io = new Server(server, {

        cors: {

            origin: "*",

            methods: ["GET", "POST"]

        }

    });

    registerConnectionHandlers(io);

};

export const getIO = () => {

    if (!io) {

        throw new Error(
            "Socket.IO not initialized."
        );

    }

    return io;

};