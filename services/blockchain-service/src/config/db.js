// ============================================================
// DATABASE CONFIGURATION
// ============================================================

import mongoose from "mongoose";

// ============================================================
// Connect To MongoDB
// ============================================================

export const connectDB = async () => {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Blockchain DB Connected:", mongoose.connection.host);

    } catch (error) {

        console.error("❌ Blockchain DB Connection Failed");

        console.error(error);

        process.exit(1);

    }

};