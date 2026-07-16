import mongoose from "mongoose";

import Profile from "../models/Profile.js";
import BuyerProfile from "../models/BuyerProfile.js";

import { ROLES } from "../../../../shared/constants/roles.js";

export const createProfile = async (userId, role, profileData) => {

    const session = await mongoose.startSession();

    session.startTransaction();

    try {

        const {
            fullName,
            phone,
            profileImage,
            language,
            address,
            companyName,
            businessType,
            gstNumber,
            licenseNumber,
        } = profileData;

        // Check if profile already exists
        const existingProfile = await Profile.findOne({ userId }).session(session);

        if (existingProfile) {
            throw new Error("Profile already exists.");
        }

        // Create Common Profile
        const profile = await Profile.create(
            [
                {
                    userId,
                    fullName,
                    phone,
                    profileImage,
                    language,
                    address,
                    profileCompleted: true,
                },
            ],
            { session }
        );

        // Create Buyer Profile only if Buyer
        if (role === ROLES.BUYER) {

            await BuyerProfile.create(
                [
                    {
                        userId,
                        companyName,
                        businessType,
                        gstNumber,
                        licenseNumber,
                    },
                ],
                { session }
            );

        }

        await session.commitTransaction();

        session.endSession();

        return profile[0];

    } catch (error) {

        await session.abortTransaction();

        session.endSession();

        throw error;

    }

};


export const getProfile = async (userId, role) => {

    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new Error("Profile not found");
    }

    let buyerProfile = null;

    if (role === ROLES.BUYER) {

        buyerProfile = await BuyerProfile.findOne({ userId });

    }

    return {
        profile,
        buyerProfile,
    };

};

export const updateProfile = async (userId, role, profileData) => {

    const {
        fullName,
        phone,
        profileImage,
        language,
        address,
        companyName,
        businessType,
        gstNumber,
        licenseNumber,
    } = profileData;

    // Update Common Profile
    const profile = await Profile.findOneAndUpdate(
        { userId },
        {
            fullName,
            phone,
            profileImage,
            language,
            address,
        },
        {
            new: true,
        }
    );

    if (!profile) {
        throw new Error("Profile not found");
    }

    let buyerProfile = null;

    if (role === ROLES.BUYER) {

        buyerProfile = await BuyerProfile.findOneAndUpdate(
            { userId },
            {
                companyName,
                businessType,
                gstNumber,
                licenseNumber,
            },
            {
                new: true,
            }
        );

    }

    return {
        profile,
        buyerProfile,
    };

};

