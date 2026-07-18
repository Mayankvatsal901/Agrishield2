import Contract from "../models/Contract.js";
import { publishPdfGeneration } from "../events/publisher.js";
import { generateCertificateNumber } from "../utils/generateCertificateNumber.js";

// ============================================================
// CREATE CONTRACT
// ------------------------------------------------------------
// Called when Deal Service publishes "deal.accepted".
//
// Responsibilities:
// 1. Generate Certificate Number
// 2. Save Contract in MongoDB
// 3. Trigger PDF Generation
// ============================================================

export const createContract = async (event) => {

    // --------------------------------------------------------
    // Generate Certificate Number
    // --------------------------------------------------------

    const certificateNumber = generateCertificateNumber();

    // --------------------------------------------------------
    // Create Contract
    // --------------------------------------------------------

    const contract = await Contract.create({

        certificateNumber,

        dealId: event.dealId,

        productId: event.productId,

        offerId: event.offerId,

        buyerId: event.buyerId,

        farmerId: event.farmerId,

        quantity: event.quantity,

        unit: event.unit,

        pricePerUnit: event.pricePerUnit,

        totalAmount: event.totalAmount,

    });

    // --------------------------------------------------------
    // Publish PDF Generation Event
    // --------------------------------------------------------

    await publishPdfGeneration({

        contractId: contract._id,

    });

    return contract;
};