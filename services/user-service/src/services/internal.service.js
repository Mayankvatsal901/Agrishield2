import Profile from "../models/Profile.js";
import KYC from "../models/KYC.js";



export const getMarketplaceEligibility = async (userId,role) => {

    const profile = await Profile.findOne({ userId });

    if (!profile) {

        throw new Error("Profile not found.");

    }
    console.log(profile.role)

   
if (role !== "FARMER") {
    return {
        canSell: false,
        reason: "Only farmers can sell.",
    };
}

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {

        return {

            canSell: false,

            reason: "Please complete KYC.",

        };

    }

    if (kyc.status !== "APPROVED") {

        return {

            canSell: false,

            reason: `KYC is ${kyc.status}.`,

        };

    }

    return {

        canSell: true,

        farmerId: userId,

        kycStatus: kyc.status,

    };

};


// ============================================================
// GET USER BY ID
// ------------------------------------------------------------
// Internal API
//
// Used by:
//
// • Contract Service
// • Notification Service
// • Future Services
//
// Returns only the information required by other
// microservices.
//
// Never expose password, OTP, refreshToken etc.
// ============================================================


export const getUserById = async (userId) => {

    const profile = await Profile.findOne({
        userId: userId
    });

    if (!profile) {
        throw new Error("Profile not found");
    }

    return profile;
};