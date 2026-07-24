import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Sends a document image to the Python AI service for verification.
 *
 * @param {string} filePath      - Absolute path to the saved upload
 * @param {string} documentType  - "AADHAAR" | "PAN" | "GST_CERTIFICATE" | ...
 * @returns {Promise<object>}    - Full verification result from AI service
 */
export const callAIVerification = async (filePath, documentType) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("document_type", documentType);

  const response = await axios.post(
    `${AI_SERVICE_URL}/api/ai/verify`,
    form,
    {
      headers: form.getHeaders(),
      timeout: 120_000,   // 2 minutes — OCR can be slow on first run
      maxContentLength: Infinity,
      maxBodyLength:    Infinity,
    }
  );

  return response.data;
};
