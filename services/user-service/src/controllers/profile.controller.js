import * as profileService from "../services/profile.service.js";

export const createProfile = async (req, res) => {
    try {

        const profile = await profileService.createProfile(
            req.user.userId,
            req.user.role,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: profile,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

export const getProfile = async (req, res) => {

    try {

        const data = await profileService.getProfile(
            req.user.userId,
            req.user.role
        );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });

    }

};

export const updateProfile = async (req, res) => {

    try {

        const data = await profileService.updateProfile(
            req.user.userId,
            req.user.role,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};