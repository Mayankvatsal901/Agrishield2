import * as offerService from "../services/offer.service.js";
import Deal from "../models/Deal.js";

// ============================================================
// CREATE OFFER CONTROLLER
// ------------------------------------------------------------
// Handles request for creating a new negotiation offer.
//
// Both BUYER and FARMER can use this endpoint.
//
// The authenticated user's ID comes from authMiddleware.
// The Deal Service determines whether that user is the
// BUYER or FARMER of the particular deal.
//
// Example:
// POST /api/deals/:dealId/offers
//
// Body:
// {
//     "quantity": 150,
//     "pricePerUnit": 25,
//     "unit": "KG",
//     "isFinalOffer": false
// }
// ============================================================

export const createOffer = async (req, res) => {

    try {

        // Get Deal ID from URL parameter
        const { dealId } = req.params;

        // Get authenticated user ID from JWT
        const userId = req.user.userId;

        // Create offer using Offer Service
        const offer = await offerService.createOffer(
            dealId,
            userId,
            
            req.body
        );

        return res.status(201).json({

            success: true,

            message: req.body.isFinalOffer
                ? "Final offer submitted successfully."
                : "Offer submitted successfully.",

            data: offer,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};
// ============================================================
// GET OFFER HISTORY CONTROLLER
// ------------------------------------------------------------
// Endpoint:
// GET /api/deals/:dealId/offers
//
// Used By:
// Negotiation panel when Buyer/Farmer opens a Deal Room.
//
// Returns:
// - Deal status
// - Current offer
// - Accepted offer
// - Complete negotiation history
// ============================================================

export const getOfferHistory = async (
    req,
    res
) => {

    try {

        const { dealId } = req.params;

        const userId = req.user.userId;


        const result =
            await offerService.getOfferHistory(
                dealId,
                userId
            );


        return res.status(200).json({

            success: true,

            message:
                "Offer history fetched successfully.",

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
// RESPOND TO FINAL OFFER CONTROLLER
// ------------------------------------------------------------
// Endpoint used by Buyer/Farmer to ACCEPT or REJECT
// the other party's final offer.
//
// Request:
// PATCH /api/deals/:dealId/offers/:offerId/respond
//
// Body:
// {
//     "action": "ACCEPT"
// }
//
// OR
//
// {
//     "action": "REJECT"
// }
// ============================================================

export const respondToFinalOffer = async (req, res) => {

    try {

        const { dealId, offerId } = req.params;

        const { action } = req.body;

        // Auth middleware provides logged-in user
        const userId = req.user.userId;

        const result =
            await offerService.respondToFinalOffer(
                dealId,
                offerId,
                userId,
                action
            );


        // ----------------------------------------------------
        // REJECT RESPONSE
        // ----------------------------------------------------

        if (result.action === "REJECTED") {

            return res.status(200).json({

                success: true,

                message:
                    "Final offer rejected. Negotiation can continue.",

                data: result,

            });
        }


        // ----------------------------------------------------
        // ACCEPT RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Final offer accepted. Negotiation is now closed and contract generation will begin.",

            data: result,

        });


    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};