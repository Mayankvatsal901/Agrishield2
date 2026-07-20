import Deal from "../models/Deal.js";
import Offer from "../models/Offer.js";
import { publishDealAccepted } from "../events/publisher.js";
import { publishOfferCreated } from "../events/publisher.js";


// ============================================================
// CREATE OFFER SERVICE
// ------------------------------------------------------------
// Creates a new negotiation offer inside an existing Deal Room.
//
// Flow:
// 1. Find the Deal Room.
// 2. Check that the deal is still OPEN.
// 3. Verify that the requesting user is either the buyer or farmer.
// 4. Determine whether the offer is from BUYER or FARMER.
// 5. Create the new Offer.
// 6. Update Deal.currentOfferId with the latest offer.
//
// NOTE:
// Product quantity validation will be added through Marketplace
// Service because Deal Service does not own Product data.
// ============================================================

export const createOffer = async (
    dealId,
    userId,
    offerData
) => {

    const {
        quantity,
        pricePerUnit,
        unit,
        isFinalOffer = false,
    } = offerData;


    // --------------------------------------------------------
    // 1. Find the Deal Room
    // --------------------------------------------------------

    const deal = await Deal.findById(dealId);

    if (!deal) {
        throw new Error("Deal not found.");
    }


    // --------------------------------------------------------
    // 2. Check whether negotiation is still active
    // --------------------------------------------------------

 // ============================================================
// BLOCK NEW OFFERS AFTER NEGOTIATION IS CLOSED
// ------------------------------------------------------------
// Once a final offer is accepted, Deal status changes from
// OPEN to CONTRACT_PENDING.
//
// No Buyer or Farmer can create another offer after this point.
// ============================================================

if (deal.status !== "OPEN") {

    throw new Error(
        "Negotiation is closed for this deal."
    );

}


    // --------------------------------------------------------
    // 3. Verify that user belongs to this Deal Room
    //
    // Only these two users can negotiate:
    // - Buyer who created the deal
    // - Farmer who owns the product
    // --------------------------------------------------------

    const isBuyer =
        deal.buyerId.toString() === userId.toString();

    const isFarmer =
        deal.farmerId.toString() === userId.toString();


    if (!isBuyer && !isFarmer) {
        throw new Error(
            "You are not authorized to make an offer in this deal."
        );
    }


    // --------------------------------------------------------
    // 4. Determine who is creating the offer
    //
    // We DO NOT trust offeredByRole from req.body.
    // The role is determined from the Deal itself.
    // --------------------------------------------------------

    const offeredByRole = isBuyer
        ? "BUYER"
        : "FARMER";


    // --------------------------------------------------------
    // 5. Basic offer validation
    // --------------------------------------------------------

    if (!quantity || quantity <= 0) {
        throw new Error(
            "Quantity must be greater than zero."
        );
    }

    if (
        pricePerUnit === undefined ||
        pricePerUnit <= 0
    ) {
        throw new Error(
            "Price per unit must be greater than zero."
        );
    }

    if (!unit) {
        throw new Error(
            "Product unit is required."
        );
    }


    // --------------------------------------------------------
    // 6. Create the Offer
    //
    // offeredBy comes from authenticated user.
    // offeredByRole comes from Deal membership.
    //
    // Therefore frontend cannot pretend to be another user.
    // --------------------------------------------------------

    const offer = await Offer.create({

        dealId: deal._id,

        offeredBy: userId,
        

        offeredByRole,

        quantity,

        pricePerUnit,

        unit,

        isFinalOffer,

        status: "PENDING",

    });


    // --------------------------------------------------------
    // 7. Update Deal with latest/current offer
    //
    // Every new offer becomes the current negotiation offer.
    // Previous offers remain stored in Offer collection,
    // giving us complete negotiation history.
    // --------------------------------------------------------

    deal.currentOfferId = offer._id;

    await deal.save();

    await publishOfferCreated({

        dealId: deal._id,
    
        negotiationRoomId: deal.negotiationRoomId,
    
        offer: {
    
            _id: offer._id,
    
            offeredBy: offer.offeredBy,
    
            offeredByRole: offer.offeredByRole,
    
            quantity: offer.quantity,
    
            pricePerUnit: offer.pricePerUnit,
    
            unit: offer.unit,
    
            isFinalOffer: offer.isFinalOffer,
    
            status: offer.status,
    
            createdAt: offer.createdAt,
    
            totalPrice:
                offer.quantity * offer.pricePerUnit,
    
        }
    
    });


    // --------------------------------------------------------
    // 8. Return created offer
    //
    // totalPrice is calculated dynamically instead of storing
    // it in MongoDB.
    // --------------------------------------------------------

    return {

        ...offer.toObject(),

        totalPrice:
            offer.quantity * offer.pricePerUnit,

    };
};

// ============================================================
// GET OFFER HISTORY
// ------------------------------------------------------------
// Returns all offers created inside a Deal Room.
//
// Used By:
// - Buyer Deal Room
// - Farmer Deal Room
// - Negotiation Panel
//
// Purpose:
// Allows frontend to display the complete negotiation timeline.
//
// Example:
//
// Buyer  -> 100 KG @ ₹25
// Farmer -> 100 KG @ ₹28
// Buyer  -> 150 KG @ ₹27
//
// Security:
// Only the Buyer or Farmer belonging to this Deal
// can view its negotiation history.
// ============================================================

export const getOfferHistory = async (
    dealId,
    userId
) => {

    // Find Deal
    const deal = await Deal.findById(dealId);

    if (!deal) {
        throw new Error("Deal not found.");
    }


    // Check whether authenticated user belongs to Deal
    const isBuyer =
        deal.buyerId.toString() === userId.toString();

    const isFarmer =
        deal.farmerId.toString() === userId.toString();


    if (!isBuyer && !isFarmer) {

        throw new Error(
            "You are not authorized to view this negotiation."
        );

    }


    // Get complete Offer history
    // Oldest offer first so frontend can show timeline naturally
    const offers = await Offer.find({
        dealId: deal._id,
    }).sort({
        createdAt: 1,
    });


    return {

        dealId: deal._id,

        dealStatus: deal.status,

        currentOfferId: deal.currentOfferId,

        acceptedOfferId: deal.acceptedOfferId,

        offers,

    };
};


// ============================================================
// RESPOND TO FINAL OFFER
// ------------------------------------------------------------
// Allows the OTHER party in a Deal Room to ACCEPT or REJECT
// a final offer.
//
// Rules:
//
// 1. Only BUYER or FARMER belonging to the deal can respond.
// 2. Only a FINAL offer can be accepted/rejected.
// 3. Creator of the final offer cannot respond to own offer.
// 4. REJECT:
//      - Offer becomes REJECTED
//      - Deal remains OPEN
//      - Negotiation can continue
//
// 5. ACCEPT:
//      - Offer becomes ACCEPTED
//      - Deal stores acceptedOfferId
//      - Deal becomes CONTRACT_PENDING
//      - Further negotiation becomes blocked
// ============================================================

export const respondToFinalOffer = async (
    dealId,
    offerId,
    userId,
    action
) => {

    // --------------------------------------------------------
    // 1. Find Deal Room
    // --------------------------------------------------------

    const deal = await Deal.findById(dealId);

    if (!deal) {
        throw new Error("Deal not found.");
    }


    // --------------------------------------------------------
    // 2. Deal must still be open for negotiation
    // --------------------------------------------------------

    if (deal.status !== "OPEN") {
        throw new Error(
            "Negotiation is already closed for this deal."
        );
    }


    // --------------------------------------------------------
    // 3. Verify user belongs to this Deal Room
    // --------------------------------------------------------

    const isBuyer =
        deal.buyerId.toString() === userId.toString();

    const isFarmer =
        deal.farmerId.toString() === userId.toString();

    if (!isBuyer && !isFarmer) {
        throw new Error(
            "You are not authorized to respond to this offer."
        );
    }


    // --------------------------------------------------------
    // 4. Find Offer
    // --------------------------------------------------------

    const offer = await Offer.findOne({
        _id: offerId,
        dealId,
    });

    if (!offer) {
        throw new Error("Offer not found.");
    }


    // --------------------------------------------------------
    // 5. Only FINAL offers can be accepted/rejected
    // --------------------------------------------------------

    if (!offer.isFinalOffer) {
        throw new Error(
            "Only a final offer can be accepted or rejected."
        );
    }


    // --------------------------------------------------------
    // 6. Prevent user from responding to their own offer
    // --------------------------------------------------------

    if (
        offer.offeredBy.toString() === userId.toString()
    ) {
        throw new Error(
            "You cannot respond to your own final offer."
        );
    }


    // --------------------------------------------------------
    // 7. Final offer must still be pending
    // --------------------------------------------------------

    if (offer.status !== "PENDING") {
        throw new Error(
            `This final offer has already been ${offer.status.toLowerCase()}.`
        );
    }


    // --------------------------------------------------------
    // 8. Validate action
    // --------------------------------------------------------

    const normalizedAction = action?.toUpperCase();

    if (
        normalizedAction !== "ACCEPT" &&
        normalizedAction !== "REJECT"
    ) {
        throw new Error(
            "Action must be either ACCEPT or REJECT."
        );
    }


    // --------------------------------------------------------
    // 9. REJECT FINAL OFFER
    // --------------------------------------------------------
    // Negotiation remains OPEN.
    // Buyer/Farmer can continue creating new offers.
    // --------------------------------------------------------

    if (normalizedAction === "REJECT") {

        offer.status = "REJECTED";

        await offer.save();

        return {
            action: "REJECTED",
            offer,
            deal,
        };
    }


    // ============================================================
// ACCEPT FINAL OFFER
// ------------------------------------------------------------
// When the other party accepts the final offer:
//
// 1. Mark offer as ACCEPTED
// 2. Save acceptedOfferId in Deal
// 3. Change Deal status to CONTRACT_PENDING
// 4. Block further negotiation
// 5. Publish DEAL_ACCEPTED event to RabbitMQ
//
// Contract Service will consume this event in background
// and generate the contract + PDF.
// ============================================================

offer.status = "ACCEPTED";

await offer.save();


// ------------------------------------------------------------
// LOCK NEGOTIATION
// ------------------------------------------------------------

deal.acceptedOfferId = offer._id;

deal.status = "CONTRACT_PENDING";

await deal.save();


// ------------------------------------------------------------
// PREPARE CONTRACT DATA
// ------------------------------------------------------------
// This contains everything Contract Service needs to begin
// contract generation.
//
// IMPORTANT:
// We send the agreed values from the ACCEPTED offer,
// not the original marketplace product quantity/price.
// ------------------------------------------------------------

const dealAcceptedEvent = {
    dealId: deal._id.toString(),
    productId: deal.productId.toString(),
    buyerId: deal.buyerId.toString(),
    farmerId: deal.farmerId.toString(),
    offerId: offer._id.toString(),
    quantity: offer.quantity,
    pricePerUnit: offer.pricePerUnit,
    unit: offer.unit,
    totalAmount: offer.quantity * offer.pricePerUnit,
};

await publishDealAccepted(dealAcceptedEvent);

return {

    action: "ACCEPTED",

    offer,

    deal,

};
}