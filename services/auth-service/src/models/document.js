import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Document metadata ─────────────────────────────────────────────────────
    documentType: {
      type: String,
      enum: ["AADHAAR", "PAN", "GST_CERTIFICATE", "LAND_CERTIFICATE", "OTHER"],
      required: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSizeBytes: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
      default: null,
    },

    // ── OCR results ───────────────────────────────────────────────────────────
    ocrText: {
      type: String,
      default: null,
    },

    extractedFields: {
      name:           { type: String, default: null },
      dob:            { type: String, default: null },
      gender:         { type: String, default: null },
      documentNumber: { type: String, default: null },
      address:        { type: String, default: null },
      pincode:        { type: String, default: null },
    },

    // ── QR data ───────────────────────────────────────────────────────────────
    qrData: {
      found:           { type: Boolean, default: false },
      symbols:         { type: Array,   default: [] },
      crossValidation: { type: Object,  default: {} },
    },

    // ── Validation report ─────────────────────────────────────────────────────
    validationResult: {
      isValid:         { type: Boolean, default: false },
      checks:          { type: Object,  default: {} },
      missingFields:   { type: Array,   default: [] },
      warnings:        { type: Array,   default: [] },
      validationScore: { type: Number,  default: 0 },
    },

    // ── Forgery detection ─────────────────────────────────────────────────────
    authenticityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    possibleForgery: {
      type: Boolean,
      default: false,
    },

    forgeryDetails: {
      techniques: { type: Object, default: {} },
      reasons:    { type: Array,  default: [] },
    },

    // ── AI processing summary ─────────────────────────────────────────────────
    aiSummary: {
      forgeryScore:    { type: Number, default: 0 },
      validationScore: { type: Number, default: 0 },
      flags:           { type: Array,  default: [] },
      processingTimeMs:{ type: Number, default: 0 },
    },

    // ── Verification status ───────────────────────────────────────────────────
    verificationStatus: {
      type: String,
      enum: ["PENDING", "AI_VERIFIED", "NEEDS_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    // ── Admin review ──────────────────────────────────────────────────────────
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminNote: {
      type: String,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for admin pending-documents query
documentSchema.index({ verificationStatus: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
