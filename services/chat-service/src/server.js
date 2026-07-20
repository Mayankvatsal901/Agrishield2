import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

import app from "./app.js";

const PORT = process.env.PORT || 5006;

/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
*/

const connectDB = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected");

    } catch (error) {

        console.error("❌ MongoDB Connection Failed");

        console.error(error.message);

        process.exit(1);

    }
};

connectDB();

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {

    console.log(
        `🚀 Chat Service running on port ${PORT}`
    );

});