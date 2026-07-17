import * as internalService from "../services/internal.service.js";
import { getUserById } from "../services/internal.service.js";

export const getMarketplaceEligibility = async (req, res) => {
    
    try {

        const result = await internalService.getMarketplaceEligibility(
            req.user.userId,
            req.user.role
        );

        return res.status(200).json({

            success: true,

            data: result,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};





// ============================================================
// GET USER DETAILS
// ------------------------------------------------------------
// Internal endpoint.
//
// Used only by microservices.
// ============================================================

export const getInternalUser = async (req, res) => {

    console.log("========== INTERNAL USER ==========");
    console.log("Requested ID:", req.params.id);
    console.log("Time:", new Date().toISOString());


    try {

        const user = await getUserById(
            req.params.id
        );

        return res.status(200).json({

            success: true,

            data: user,

        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message: error.message,

        });

    }

};