import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
{
    // -------------------------------------------------
    // Certificate Information
    // -------------------------------------------------

    certificateNumber: {
        type: String,
        required: true,
        unique: true,
    },

    // -------------------------------------------------
    // References
    // -------------------------------------------------

    dealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deal",
        required: true,
        unique: true,
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    // -------------------------------------------------
    // Agreed Contract Details
    // -------------------------------------------------

    quantity: {
        type: Number,
        required: true,
    },

    unit: {
        type: String,
        required: true,
    },

    pricePerUnit: {
        type: Number,
        required: true,
    },

    totalAmount: {
        type: Number,
        required: true,
    },

    // -------------------------------------------------
    // PDF Information
    // -------------------------------------------------

    pdfUrl: {
        type: String,
        default: null,
    },

    pdfPublicId: {
        type: String,
        default: null,
    },

    pdfFileName: {
        type: String,
        default: null,
    },

    // -------------------------------------------------
    // Contract Status
    // -------------------------------------------------

    status: {
        type: String,
        enum: [
            "GENERATING",
            "ACTIVE",
            "COMPLETED",
            "CANCELLED",
        ],
        default: "GENERATING",
    },

    // -------------------------------------------------
    // Important Dates
    // -------------------------------------------------

    generatedAt: {
        type: Date,
        default: null,
    },

    completedAt: {
        type: Date,
        default: null,
    },

    cancelledAt: {
        type: Date,
        default: null,
    },
    version: {
        type: Number,
        default: 1,
    },

},
{
    timestamps: true,
});

export default mongoose.model("Contract", contractSchema);