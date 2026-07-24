import * as documentService from "../services/document.service.js";

const VALID_DOC_TYPES = new Set([
  "AADHAAR",
  "PAN",
  "GST_CERTIFICATE",
  "LAND_CERTIFICATE",
  "OTHER",
]);

// ── POST /documents/upload ────────────────────────────────────────────────────
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const { documentType } = req.body;
    if (!documentType || !VALID_DOC_TYPES.has(documentType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid documentType. Valid values: ${[...VALID_DOC_TYPES].join(", ")}`,
      });
    }

    const result = await documentService.uploadAndVerify(
      req.user._id,
      req.file,
      documentType.toUpperCase()
    );

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /documents/verify  (re-verify an existing document) ─────────────────
export const verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, message: "documentId is required." });
    }

    // Fetch existing doc, re-run AI on its stored file
    const { document: doc } = await documentService.getDocumentById(
      documentId,
      req.user._id,
      req.user.role
    );

    // Re-use the same file path already on disk
    const fakeFile = {
      path:         doc.filePath,
      originalname: doc.originalFileName,
      size:         doc.fileSizeBytes,
      mimetype:     doc.mimeType,
    };

    const result = await documentService.uploadAndVerify(
      doc.userId,
      fakeFile,
      doc.documentType
    );

    // Overwrite the old document record
    await doc.deleteOne();

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ── GET /documents/me ─────────────────────────────────────────────────────────
export const getMyDocuments = async (req, res) => {
  try {
    const result = await documentService.getMyDocuments(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /documents/pending  (admin) ──────────────────────────────────────────
export const getPendingDocuments = async (req, res) => {
  try {
    const result = await documentService.getPendingDocuments();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /documents/:id ────────────────────────────────────────────────────────
export const getDocumentById = async (req, res) => {
  try {
    const result = await documentService.getDocumentById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    return res.status(200).json(result);
  } catch (error) {
    const status = error.message === "Access denied" ? 403
                 : error.message === "Document not found" ? 404
                 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── POST /documents/admin/approve ────────────────────────────────────────────
export const approveDocument = async (req, res) => {
  try {
    const { documentId, note } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, message: "documentId is required." });
    }
    const result = await documentService.approveDocument(documentId, req.user._id, note);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ── POST /documents/admin/reject ─────────────────────────────────────────────
export const rejectDocument = async (req, res) => {
  try {
    const { documentId, note } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, message: "documentId is required." });
    }
    const result = await documentService.rejectDocument(documentId, req.user._id, note);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ── DELETE /documents/:id ─────────────────────────────────────────────────────
export const deleteDocument = async (req, res) => {
  try {
    const result = await documentService.deleteDocument(
      req.params.id,
      req.user._id,
      req.user.role
    );
    return res.status(200).json(result);
  } catch (error) {
    const status = error.message === "Access denied" ? 403
                 : error.message === "Document not found" ? 404
                 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};
