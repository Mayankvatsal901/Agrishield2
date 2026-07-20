import Deal from "../models/Deal.js";
import { getProductDetails } from "../clients/marketplace.client.js";

import { createChat } from "../clients/chat.client.js";
import {
    publishDealCreated,
} from "../events/publisher.js";

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

/**
 * ============================================================================
 * FILE: Deal.js
 * SERVICE: Deal Service
 *
 * PURPOSE:
 * Represents one negotiation/deal between a Buyer and Farmer
 * for a particular marketplace product.
 *
 * CREATED WHEN:
 * Buyer clicks "Start Negotiation" from the Deal Room UI.
 *
 * USED BY FRONTEND:
 * - Buyer Deal Room
 * - Farmer Deal Room
 * - My Deals Page
 *
 * RELATIONSHIPS:
 * Product  -> Marketplace Service
 * Buyer    -> Auth/User Service
 * Farmer   -> Auth/User Service
 * Offers   -> Offer collection through dealId
 *
 * IMPORTANT:
 * Chat is NOT stored here.
 * Chat Service and Deal Service are independent.
 * ============================================================================
 */

export const createDeal = async (buyerId, productId) => {

    /*
    |--------------------------------------------------------------------------
    | Get Product Details
    |--------------------------------------------------------------------------
    */

    const product = await getProductDetails(productId);

    if (!product) {
        throw new Error("Product not found.");
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Product Status
    |--------------------------------------------------------------------------
    */

    if (product.status !== "ACTIVE") {
        throw new Error(
            "This product is currently not available for a new deal."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Farmer From Buying Own Product
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
    | Create Deal
    |--------------------------------------------------------------------------
    */

    const deal = await Deal.create({

        buyerId,

        farmerId: product.farmerId,

        productId,

        status: "OPEN",

    });

    try {

        /*
        |--------------------------------------------------------------------------
        | Create Chat
        |--------------------------------------------------------------------------
        */

        const chat = await createChat({

            dealId: deal._id,

            buyerId,

            farmerId: product.farmerId,

        });

        /*
        |--------------------------------------------------------------------------
        | Update Deal
        |--------------------------------------------------------------------------
        */

        deal.chatId = chat.chatId;

        deal.negotiationRoomId = `negotiation_${deal._id}`;

        await deal.save();

        /*
        |--------------------------------------------------------------------------
        | Publish Deal Created Event
        |--------------------------------------------------------------------------
        */
        console.log({
            dealId: deal._id,
            chatId: deal.chatId,
            negotiationRoomId: deal.negotiationRoomId
        });
        await publishDealCreated({

            dealId: deal._id,
        
            buyerId,
        
            farmerId: product.farmerId,
        
            chatId: deal.chatId,
        
            negotiationRoomId: deal.negotiationRoomId,
        
        });
       

        return {

            deal,

            alreadyExists: false,

        };

    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | Rollback
        |--------------------------------------------------------------------------
        | Chat creation failed or Event publishing failed.
        | Remove the Deal to avoid inconsistent data.
        |--------------------------------------------------------------------------
        */

        await Deal.findByIdAndDelete(deal._id);

        throw error;

    }

};