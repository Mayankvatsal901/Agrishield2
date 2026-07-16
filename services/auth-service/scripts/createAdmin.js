import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";

import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";

const DEFAULT_PASSWORD = "Admin@123";

const createAdmin = async () => {

    try {

        await connectDB();

        const existingAdmin = await User.findOne({
            email: process.env.ADMIN_EMAIL,
        });

        if (existingAdmin) {

            console.log("⚠️ Admin already exists.");

            process.exit(0);

        }

        const hashedPassword = await bcrypt.hash(
            DEFAULT_PASSWORD,
            10
        );

        const admin = await User.create({

            email: process.env.ADMIN_EMAIL,

            password: hashedPassword,

            role: "ADMIN",

            emailVerified: true,

            profileCompleted: true,

            isActive: true,

        });

        console.log("✅ Admin created successfully.");

        console.log(admin);

        process.exit(0);

    } catch (error) {

        console.log("❌ Failed to create admin.");

        console.log(error.message);

        process.exit(1);

    }

};

createAdmin();