import * as internalService from "../services/internal.service.js";

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