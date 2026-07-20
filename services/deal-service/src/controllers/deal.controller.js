import * as dealService from "../services/deal.service.js";

import Deal from "../models/Deal.js";

/*
|--------------------------------------------------------------------------
| CREATE / START DEAL CONTROLLER
|--------------------------------------------------------------------------
| Endpoint:
| POST /api/deals
|
| Request Body:
| {
|     "productId": "PRODUCT_ID"
| }
|
| buyerId comes from the authenticated JWT token.
|--------------------------------------------------------------------------
*/

export const createDeal = async (req, res) => {

    try {

        const buyerId = req.user.userId;

        const { productId } = req.body;


        // Product ID is required to start a deal
        if (!productId) {

            return res.status(400).json({
                success: false,
                message: "Product ID is required.",
            });

        }


        const result = await dealService.createDeal(
            buyerId,
            productId
        );


        return res.status(
            result.alreadyExists ? 200 : 201
        ).json({

            success: true,

            message: result.alreadyExists
                ? "Existing deal returned."
                : "Deal created successfully.",

            data: result.deal,

        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

// controllers/internal.controller.js


export const getDealSocketData = async (req, res) => {

    try {

        const { dealId } = req.params;

        const deal = await Deal.findById(dealId);

        if (!deal) {

            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });

        }

        return res.json({

            success: true,

            data: {

                dealId: deal._id,

                negotiationRoomId: deal.negotiationRoomId,

                chatId: deal.chatId,

            }

        });

    } catch (error) {

        console.error("Internal Deal API Error:");
        console.error(error);
    
        return res.status(500).json({
    
            success: false,
    
            message: error.message,
    
            stack: error.stack
    
        });
    
    }

};