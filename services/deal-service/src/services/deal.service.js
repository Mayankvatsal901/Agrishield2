import Deal from "../models/Deal.js";
import { getProductDetails } from "../clients/marketplace.client.js";


/*
|--------------------------------------------------------------------------
| CREATE / START DEAL
|--------------------------------------------------------------------------
| Purpose:
| Creates a Deal Room between a Buyer and Farmer for a specific product.
|
| Flow:
| 1. Receive buyerId from authenticated JWT.
| 2. Receive productId from request.
| 3. Fetch product details from Marketplace Service.
| 4. Get farmerId from the product.
| 5. Verify product is available for a deal.
| 6. Check if this buyer already has a deal for this product.
| 7. If yes, return existing deal.
| 8. Otherwise, create a new Deal Room.
|
| NOTE:
| Chat Room and Negotiation are NOT created here.
| They are created only when the user explicitly starts them.
|--------------------------------------------------------------------------
*/

export const createDeal = async (buyerId, productId) => {

    // Get product details from Marketplace Service
    const product = await getProductDetails(productId);

    if (!product) {
        throw new Error("Product not found.");
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Product Status
    |--------------------------------------------------------------------------
    | Only ACTIVE products should allow new deals.
    |--------------------------------------------------------------------------
    */

    if (product.status !== "ACTIVE") {
        throw new Error(
            "This product is currently not available for a new deal."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Prevent Farmer From Creating Deal With Own Product
    |--------------------------------------------------------------------------
    */

    if (product.farmerId.toString() === buyerId.toString()) {
        throw new Error(
            "You cannot create a deal for your own product."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Check Existing Deal
    |--------------------------------------------------------------------------
    | Same buyer + same product should reuse the existing Deal Room.
    |--------------------------------------------------------------------------
    */

    const existingDeal = await Deal.findOne({
        buyerId,
        productId,
    });

    if (existingDeal) {

        return {
            deal: existingDeal,
            alreadyExists: true,
        };

    }


    /*
    |--------------------------------------------------------------------------
    | Create Deal Room
    |--------------------------------------------------------------------------
    */

    const deal = await Deal.create({

        buyerId,

        farmerId: product.farmerId,

        productId,

        chatRoomId: null,

        negotiationId: null,

        status: "OPEN",

    });


    return {
        deal,
        alreadyExists: false,
    };
};