import dns from "node:dns";
// Some Indian ISPs refuse the SRV lookups used by mongodb+srv:// addresses
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5001;

await connectDB();

app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});