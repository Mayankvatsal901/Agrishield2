import * as dealService from "../services/deal.service.js";

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