// ============================================================
// CONTRACT ROUTES
// ------------------------------------------------------------
// GET /api/contracts/deal/:dealId
//     The contract for a deal. 404 until it has been created.
//
// GET /api/contracts/certificate/:certificateNumber
//     Look a contract up by its certificate number.
//
// Returns only what's printed on the contract anyway (no
// buyer/farmer ids), since contracts are meant to be checkable.
// ============================================================

import express from "express";
import mongoose from "mongoose";
import Contract from "../models/Contract.js";

const router = express.Router();

const view = (c) => ({
    contractId: c._id,
    dealId: c.dealId,
    certificateNumber: c.certificateNumber,
    status: c.status,
    pdfUrl: c.pdfUrl,
    blockchainHash: c.blockchainHash || null,
    quantity: c.quantity,
    unit: c.unit,
    pricePerUnit: c.pricePerUnit,
    totalAmount: c.totalAmount,
    generatedAt: c.generatedAt,
    createdAt: c.createdAt,
});

router.get("/deal/:dealId", async (req, res) => {
    const { dealId } = req.params;
    if (!mongoose.isValidObjectId(dealId)) {
        return res.status(400).json({ success: false, message: "That isn't a valid deal id." });
    }
    const contract = await Contract.findOne({ dealId });
    if (!contract) {
        return res.status(404).json({ success: false, message: "No contract for this deal yet." });
    }
    return res.json({ success: true, data: view(contract) });
});

router.get("/certificate/:certificateNumber", async (req, res) => {
    const contract = await Contract.findOne({ certificateNumber: req.params.certificateNumber });
    if (!contract) {
        return res.status(404).json({ success: false, message: "No contract with that certificate number." });
    }
    return res.json({ success: true, data: view(contract) });
});

export default router;