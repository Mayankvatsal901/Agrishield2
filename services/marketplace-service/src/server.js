import dns from "node:dns";
// Some Indian ISPs refuse the SRV lookups used by mongodb+srv:// addresses
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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