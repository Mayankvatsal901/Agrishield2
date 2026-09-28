import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import dotenv from "dotenv";

// Load .env first
dotenv.config();

// Import everything after dotenv is loaded
const { default: connectDB } = await import("./config/database.js");
const { connectRabbitMQ } = await import("./config/rabbitmq.js");
const { subscribeToContractGenerated } = await import("./events/subscriber.js");
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 5004;

const startServer = async () => {
    try {
        await connectDB();
        await connectRabbitMQ();

        // Mark deals "Contract ready" when Contract Service finishes a PDF
        await subscribeToContractGenerated();

        app.listen(PORT, () => {
            console.log(`🚀 Deal Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start Deal Service:", error);
        process.exit(1);
    }
};

startServer();