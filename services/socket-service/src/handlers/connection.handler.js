import { registerNegotiationHandlers } from "./negotiation.handler.js";

import { registerChatHandlers } from "./chat.handler.js";

export const registerConnectionHandlers = (io) => {

    io.on("connection", (socket) => {

        console.log(
            `✅ User Connected : ${socket.id}`
        );

        registerNegotiationHandlers(socket);

        registerChatHandlers(socket);

        socket.on("disconnect", () => {

            console.log(
                `❌ ${socket.id} disconnected`
            );

        });

    });

};