import express from "express";
import upload from "../middleware/upload.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  uploadDocument,
  verifyDocument,
  getMyDocuments,
  getDocumentById,
  getPendingDocuments,
  approveDocument,
  rejectDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

const router = express.Router();

// All routes require a valid JWT
router.use(authMiddleware);

// ── Static paths first (must come before /:id) ────────────────────────────────

// Upload a new document and trigger AI verification
router.post(
  "/upload",
  authorize("FARMER", "BUYER", "ADMIN"),
  upload.single("document"),
  uploadDocument
);

// Re-verify an already-uploaded document by its ID
router.post(
  "/verify",
  authorize("FARMER", "BUYER", "ADMIN"),
  verifyDocument
);

// Get all documents belonging to the logged-in user
router.get(
  "/me",
  authorize("FARMER", "BUYER", "ADMIN"),
  getMyDocuments
);

// List all documents pending human review  ← MUST be before /:id
router.get(
  "/pending",
  authorize("ADMIN"),
  getPendingDocuments
);

// Approve a document
router.post(
  "/admin/approve",
  authorize("ADMIN"),
  approveDocument
);

// Reject a document
router.post(
  "/admin/reject",
  authorize("ADMIN"),
  rejectDocument
);

// ── Dynamic :id routes last ───────────────────────────────────────────────────

// Get a single document by ID (owner or admin)
router.get(
  "/:id",
  authorize("FARMER", "BUYER", "ADMIN"),
  getDocumentById
);

// Delete a document (owner or admin)
router.delete(
  "/:id",
  authorize("FARMER", "BUYER", "ADMIN"),
  deleteDocument
);

export default router;
