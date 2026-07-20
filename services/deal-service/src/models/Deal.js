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

import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
    {

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        status: {
            type: String,

            enum: [
                "OPEN",
                "NEGOTIATING",
                "FINAL_OFFER",
                "ACCEPTED",
                "REJECTED",
                "CANCELLED",
                "CONTRACT_PENDING",
                "CONTRACT_GENERATED",
                "COMPLETED",
            ],

            default: "OPEN",
        },

        // Points to the most recently submitted offer.
        // This avoids searching the Offer collection every time
        // we only need the current/latest offer.
        currentOfferId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
            default: null,
        },
        /**
 * Chat room associated with this deal.
 * Created immediately when the deal is created.
 */
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        
        negotiationRoomId: {
            type: String,
            default: null,
        },

        // Set when a final offer has been accepted.
        acceptedOfferId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
            default: null,
        },

    },
    {
        timestamps: true,
    }
);

/**
 * Prevents the same buyer from opening multiple active
 * negotiations for the same product.
 *
 * We will also handle this condition inside the service layer.
 */
dealSchema.index({
    productId: 1,
    buyerId: 1,
    status: 1,
});

const Deal = mongoose.model(
    "Deal",
    dealSchema
);

export default Deal;