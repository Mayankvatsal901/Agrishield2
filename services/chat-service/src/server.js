import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 6000;

const startServer = async () => {

    try {

        await connectDB();

        await connectRabbitMQ();

        app.listen(PORT, () => {

            console.log(
                `🚀 Chat Service running on port ${PORT}`
            );

        });

    }

    catch (error) {

        console.error(error);

        process.exit(1);

    }

};

startServer();