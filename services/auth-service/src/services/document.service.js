import fs from "fs";
import Document from "../models/document.js";
import { callAIVerification } from "../utils/aiClient.js";

// ── Upload & Verify ───────────────────────────────────────────────────────────

export const uploadAndVerify = async (userId, file, documentType) => {
  // 1. Call AI service
  let aiResult;
  try {
    aiResult = await callAIVerification(file.path, documentType);
  } catch (err) {
    // If AI service is unreachable, store the document as PENDING
    const doc = await Document.create({
      userId,
      documentType,
      originalFileName: file.originalname,
      filePath:         file.path,
      fileSizeBytes:    file.size,
      mimeType:         file.mimetype,
      verificationStatus: "PENDING",
    });
    return {
      success: true,
      message: "Document uploaded. AI service unavailable — queued for manual review.",
      document: doc,
    };
  }

  // 2. Map AI result → document fields
  const summary    = aiResult.summary    || {};
  const ocr        = aiResult.ocr        || {};
  const qr         = aiResult.qr         || {};
  const validation = aiResult.validation || {};
  const forgery    = aiResult.forgery    || {};
  const fields     = ocr.extracted_fields || {};

  // Determine verification status from AI summary
  const statusMap = {
    VERIFIED:      "AI_VERIFIED",
    NEEDS_REVIEW:  "NEEDS_REVIEW",
    REJECTED:      "NEEDS_REVIEW",   // AI rejection → human review, not auto-reject
  };
  const verificationStatus = statusMap[summary.verification_status] || "NEEDS_REVIEW";

  // 3. Persist to MongoDB
  const doc = await Document.create({
    userId,
    documentType,
    originalFileName:  file.originalname,
    filePath:          aiResult.file_path || file.path,
    fileSizeBytes:     file.size,
    mimeType:          file.mimetype,

    ocrText:           ocr.full_text || null,
    extractedFields: {
      name:           fields.name           || null,
      dob:            fields.dob            || null,
      gender:         fields.gender         || null,
      documentNumber: fields.document_number|| null,
      address:        fields.address        || null,
      pincode:        fields.pincode        || null,
    },

    qrData: {
      found:           qr.found            || false,
      symbols:         qr.symbols          || [],
      crossValidation: qr.cross_validation || {},
    },

    validationResult: {
      isValid:         validation.is_valid         || false,
      checks:          validation.checks           || {},
      missingFields:   validation.missing_fields   || [],
      warnings:        validation.warnings         || [],
      validationScore: validation.validation_score || 0,
    },

    authenticityScore: forgery.authenticity_score || 0,
    possibleForgery:   forgery.possible_forgery   || false,
    forgeryDetails: {
      techniques: forgery.techniques || {},
      reasons:    forgery.reasons    || [],
    },

    aiSummary: {
      forgeryScore:     summary.forgery_score     || 0,
      validationScore:  summary.validation_score  || 0,
      flags:            summary.flags             || [],
      processingTimeMs: aiResult.processing_time_ms || 0,
    },

    verificationStatus,
  });

  return {
    success: true,
    message: "Document uploaded and verified by AI.",
    document: doc,
  };
};


// ── Get own documents ─────────────────────────────────────────────────────────

export const getMyDocuments = async (userId) => {
  const docs = await Document.find({ userId })
    .select("-forgeryDetails.techniques")   // omit verbose forensics data
    .sort({ createdAt: -1 });

  return { success: true, count: docs.length, documents: docs };
};


// ── Get single document ───────────────────────────────────────────────────────

export const getDocumentById = async (documentId, userId, userRole) => {
  const doc = await Document.findById(documentId).populate("verifiedBy", "email role");

  if (!doc) throw new Error("Document not found");

  // Non-admins can only view their own documents
  if (userRole !== "ADMIN" && doc.userId.toString() !== userId.toString()) {
    throw new Error("Access denied");
  }

  return { success: true, document: doc };
};


// ── Get pending documents (admin) ─────────────────────────────────────────────

export const getPendingDocuments = async () => {
  const docs = await Document.find({
    verificationStatus: { $in: ["PENDING", "NEEDS_REVIEW"] },
  })
    .populate("userId", "email role")
    .sort({ createdAt: 1 });   // oldest first

  return { success: true, count: docs.length, documents: docs };
};


// ── Admin approve ─────────────────────────────────────────────────────────────

export const approveDocument = async (documentId, adminId, note) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  doc.verificationStatus = "APPROVED";
  doc.verifiedBy         = adminId;
  doc.adminNote          = note || null;
  doc.reviewedAt         = new Date();
  await doc.save();

  return { success: true, message: "Document approved.", document: doc };
};


// ── Admin reject ──────────────────────────────────────────────────────────────

export const rejectDocument = async (documentId, adminId, note) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  doc.verificationStatus = "REJECTED";
  doc.verifiedBy         = adminId;
  doc.adminNote          = note || null;
  doc.reviewedAt         = new Date();
  await doc.save();

  return { success: true, message: "Document rejected.", document: doc };
};


// ── Delete document ───────────────────────────────────────────────────────────

export const deleteDocument = async (documentId, userId, userRole) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  if (userRole !== "ADMIN" && doc.userId.toString() !== userId.toString()) {
    throw new Error("Access denied");
  }

  // Remove file from disk
  if (doc.filePath && fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath);
  }

  await doc.deleteOne();
  return { success: true, message: "Document deleted." };
};
