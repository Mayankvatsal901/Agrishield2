import axios from "axios";

// ============================================================
// ML SERVICE CLIENT (OCR)
// ------------------------------------------------------------
// Reads name, number and date of birth from the KYC images.
//
// If the ML service is down or can't read the documents, the KYC
// submission still goes through with ocrStatus "FAILED", so an admin
// can review the images by hand instead of the farmer being blocked.
// ============================================================

const EMPTY_OCR = {
    aadhaar: { name: "", dob: "", gender: "", aadhaarNumber: "" },
    pan: { name: "", panNumber: "", fatherName: "", dob: "" },
};

export const extractKYC = async (documents) => {

    try {

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/ocr/kyc`,
            { documents },
            { timeout: 120000 } // OCR on three images can take a while
        );

        return response.data.data;

    } catch (error) {

        const reason = error.response?.data?.message || error.code || error.message;
        console.error("⚠️ OCR failed, saving KYC for manual review:", reason);

        return {
            ocrData: EMPTY_OCR,
            ocrStatus: "FAILED",
            ocrConfidence: 0,
        };

    }

};
