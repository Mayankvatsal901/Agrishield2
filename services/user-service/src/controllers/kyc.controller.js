import * as kycService from "../services/kyc.service.js";

export const uploadKYC = async (req, res) => {

    try {

        const kycData = {

            aadhaarFront: req.files.aadhaarFront?.[0]?.path || "",

            aadhaarBack: req.files.aadhaarBack?.[0]?.path || "",

            panCard: req.files.panCard?.[0]?.path || "",

        };

        const kyc = await kycService.uploadKYC(
            req.user.userId,
            kycData
        );

        return res.status(200).json({
            success: true,
            message: "KYC Submitted Successfully",
            data: kyc,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const getKYC = async (req, res) => {

    try {

        const kyc = await kycService.getKYC(
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            data: kyc,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};




