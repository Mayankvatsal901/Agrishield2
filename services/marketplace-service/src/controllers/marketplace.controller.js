import * as marketplaceService from "../services/marketplace.service.js";

export const browseMarketplace = async (req, res) => {
    
    console.log("Marketplace API Hit");
    try {

        const result = await marketplaceService.browseMarketplace(
            req.query
        );

        return res.status(200).json({

            success: true,

            data: result,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

export const getProductDetails = async (req, res) => {

    try {

        const product = await marketplaceService.getProductDetails(
            req.params.productId
        );

        return res.status(200).json({

            success: true,

            data: product,

        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message: error.message,

        });

    }

};