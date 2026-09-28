import Contract from "../models/Contract.js";
import { publishContractGenerated, publishPdfGeneration } from "../events/publisher.js";
import { generateCertificateNumber } from "../utils/generateCertificateNumber.js";

// ============================================================
// CONTRACT READY MESSAGE
// ------------------------------------------------------------
// What gets announced when a contract's PDF is ready.
// dealId is essential: the deal room and deal service use it
// to know which deal the contract belongs to.
// ============================================================

export const contractGeneratedPayload = (contract, extra = {}) => ({
    contractId: contract._id,
    dealId: contract.dealId,
    buyerId: contract.buyerId,
    farmerId: contract.farmerId,
    certificateNumber: contract.certificateNumber,
    pdfUrl: contract.pdfUrl,
    blockchainHash: contract.blockchainHash || null,
    generatedAt: contract.generatedAt || new Date(),
    ...extra,
});

// ============================================================
// CREATE CONTRACT
// ------------------------------------------------------------
// Called when Deal Service publishes "deal.accepted".
//
// Safe to receive the same deal twice (for example when a
// lost message is re-sent): it never makes a second contract.
// ============================================================

export const createContract = async (event) => {

    const existing = await Contract.findOne({ dealId: event.dealId });

    if (existing) {
        if (existing.status === "ACTIVE" && existing.pdfUrl) {
            console.log(`ℹ️  Contract already exists for deal ${event.dealId}. Announcing it again.`);
            await publishContractGenerated(contractGeneratedPayload(existing));
        } else {
            console.log(`ℹ️  Contract for deal ${event.dealId} is still generating. Re-queuing its PDF.`);
            await publishPdfGeneration({ contractId: existing._id });
        }
        return existing;
    }

    const contract = await Contract.create({
        certificateNumber: generateCertificateNumber(),
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

    await publishPdfGeneration({ contractId: contract._id });

    return contract;
};