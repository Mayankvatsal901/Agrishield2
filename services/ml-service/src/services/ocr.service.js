import { downloadImage } from "../utils/downloadImage.js";
import { extractText } from "../utils/extractText.js";
import { parseAadhaar } from "../utils/parseAadhaar.js";
import { parsePAN } from "../utils/parsePAN.js";
import { preprocessImage } from "../utils/preprocessImage.js";

export const extractKYC = async (documents) => {

    // -------------------------
    // Aadhaar OCR
    // -------------------------

    const aadhaarBuffer = await downloadImage(
        documents.aadhaar.front
    );
    
    const processedAadhaar =
        await preprocessImage(aadhaarBuffer);

        const aadhaarOCR =
        await extractText(processedAadhaar);

    const aadhaarData = parseAadhaar(
        aadhaarOCR.text
    );

    // -------------------------
    // PAN OCR
    // -------------------------

    const panBuffer = await downloadImage(
        documents.pan.image
    );
    
    const processedPan =
        await preprocessImage(panBuffer);

        const panOCR =
        await extractText(processedPan);

    const panData = parsePAN(
        panOCR.text
    );

    // -------------------------
    // Average Confidence
    // -------------------------

    const confidence = (

        aadhaarOCR.confidence +

        panOCR.confidence

    ) / 2;

    return {

        ocrData: {

            aadhaar: aadhaarData,

            pan: panData,

        },

        ocrStatus: "COMPLETED",

        ocrConfidence: Number(
            confidence.toFixed(2)
        ),

    };

};