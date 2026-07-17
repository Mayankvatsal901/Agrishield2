/**
 * ============================================================================
 * FILE: database.js
 * SERVICE: Deal Service
 *
 * PURPOSE:
 * Connects the Deal Service to MongoDB.
 *
 * DATABASE:
 * deal-db
 *
 * USED BY:
 * - server.js during Deal Service startup.
 *
 * STORES:
 * - Deals
 * - Offers
 * ============================================================================
 */

import mongoose from "mongoose";

const connectDB = async () => {

    try {

        const connection = await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            `✅ Deal DB Connected: ${connection.connection.host}`
        );

    } catch (error) {

        console.error(
            `❌ Deal DB Connection Error: ${error.message}`
        );

        process.exit(1);

    }

};

export default connectDB;