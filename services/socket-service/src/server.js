import dotenv from "dotenv";
dotenv.config();

import http from "http";

import app from "./app.js";

import { initializeSocket } from "./config/socket.js";

import { connectRabbitMQ } from "./config/rabbitmq.js";

import { subscribeDealEvents } from "./events/subscriber.js";

const PORT = process.env.PORT || 5008;

const startServer = async () => {

    await connectRabbitMQ();

    const server = http.createServer(app);

    initializeSocket(server);

    await subscribeDealEvents();

    server.listen(PORT, () => {

        console.log(
            `🚀 Socket Service running on ${PORT}`
        );

    });

};

startServer();