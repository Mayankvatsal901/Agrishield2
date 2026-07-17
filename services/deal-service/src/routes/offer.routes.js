import express from "express";

import authMiddleware from "../../../../shared/middleware/authMiddleware.js";

import {
    createOffer,getOfferHistory,respondToFinalOffer
} from "../controllers/offer.controller.js";


const router = express.Router();


// ============================================================
// CREATE NEGOTIATION OFFER
// ------------------------------------------------------------
// Creates a new offer inside an existing Deal Room.
//
// Accessible only to:
// - Buyer of the deal
// - Farmer of the deal
//
// Normal Offer:
// isFinalOffer = false
//
// Final Offer:
// isFinalOffer = true
//
// POST /api/deals/:dealId/offers
// ============================================================

router.post(
    "/:dealId/offers",
    authMiddleware,
    createOffer
);

// ============================================================
// GET NEGOTIATION / OFFER HISTORY
// ------------------------------------------------------------
// GET /api/deals/:dealId/offers
//
// Only the Buyer and Farmer belonging to this Deal
// can access the negotiation history.
// ============================================================

router.get(
    "/:dealId/offers",
    authMiddleware,
    getOfferHistory
);

// ============================================================
// RESPOND TO FINAL OFFER
// ------------------------------------------------------------
// Allows the opposite party to ACCEPT or REJECT a final offer.
//
// PATCH
// /api/deals/:dealId/offers/:offerId/respond
//
// Requires authentication.
// ============================================================

router.patch(
    "/:dealId/offers/:offerId/respond",
    authMiddleware,
    respondToFinalOffer
);


export default router;