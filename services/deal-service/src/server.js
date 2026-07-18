import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 5004;

const startServer = async () => {
    try {

        // Connect Deal Service database
        await connectDB();

        // Connect RabbitMQ
        await connectRabbitMQ();

        app.listen(PORT, () => {
            console.log(`🚀 Deal Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start Deal Service:", error.message);
        process.exit(1);
    }
};

startServer();