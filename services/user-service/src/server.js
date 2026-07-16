import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

// Import modules AFTER dotenv is loaded
const { default: connectDB } = await import("./config/db.js");
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 5002;

const startServer = async () => {
    try {

        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 User Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

startServer();