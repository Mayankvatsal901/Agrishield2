import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

// Import modules AFTER dotenv is loaded
const { default: app } = await import("./app.js");
const { connectDB } = await import("./config/database.js");

const PORT = process.env.PORT || 5003;

await connectDB();

app.listen(PORT, () => {
    console.log(`🚀 Marketplace Service running on port ${PORT}`);
});