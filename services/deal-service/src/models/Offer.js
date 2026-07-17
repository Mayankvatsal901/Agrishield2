import mongoose from "mongoose";

// ============================================================
// OFFER MODEL
// ------------------------------------------------------------
// Stores every price/quantity offer made during a negotiation.
//
// Both BUYER and FARMER can create offers.
//
// Example flow:
// Buyer  -> 50 KG @ ₹25/KG
// Farmer -> 50 KG @ ₹28/KG
// Buyer  -> 40 KG @ ₹27/KG
//
// Every offer belongs to one Deal Room.
// ============================================================

const offerSchema = new mongoose.Schema(
    {
        // Deal Room in which this offer was made
        dealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deal",
            required: true,
            index: true,
        },

        // User ID of the person who created this offer
        // Can be either buyerId or farmerId
        offeredBy: {
            type: String,
            required: true,
        },

        // Helps frontend identify whether offer came
        // from BUYER or FARMER
        offeredByRole: {
            type: String,
            enum: ["BUYER", "FARMER"],
            required: true,
        },

        // Quantity the user wants to buy/sell
        // Example: 50
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        // Price for one unit
        // Example: ₹25 per KG
        pricePerUnit: {
            type: Number,
            required: true,
            min: 0,
        },

        // Unit used by the product
        // Example: KG, TON, QUINTAL
        unit: {
            type: String,
            required: true,
        },

        // Indicates whether the sender considers
        // this their final offer.
        //
        // false -> Normal negotiation offer
        // true  -> Other party must ACCEPT or REJECT
        isFinalOffer: {
            type: Boolean,
            default: false,
        },

        // Status is mainly useful for FINAL offers.
        //
        // PENDING  -> Waiting for response
        // ACCEPTED -> Other party accepted
        // REJECTED -> Other party rejected
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;