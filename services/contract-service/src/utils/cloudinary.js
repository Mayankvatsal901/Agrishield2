// ============================================================
// CLOUDINARY UTILITY
// ------------------------------------------------------------
// Responsibility:
//
// Upload Contract PDFs to Cloudinary.
//
// Input:
//      Local PDF Path
//
// Output:
//
// {
//      pdfUrl,
//      pdfPublicId,
//      pdfFileName
// }
//
// ============================================================

import { v2 as cloudinary } from "cloudinary";


// ------------------------------------------------------------
// Configure Cloudinary
// ------------------------------------------------------------

cloudinary.config({

    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

    api_key: process.env.CLOUDINARY_API_KEY,

    api_secret: process.env.CLOUDINARY_API_SECRET,

});

// ------------------------------------------------------------
// Upload Contract PDF
// ------------------------------------------------------------

export const uploadPDF = async (pdfPath) => {
    try {

        const result = await cloudinary.uploader.upload(

            pdfPath,

            {

                resource_type: "raw",

                folder: "agrishield/contracts",

            }

        );

        return {

            pdfUrl: result.secure_url,

            pdfPublicId: result.public_id,

            pdfFileName: result.original_filename,

        };

    } catch (error) {

        console.error("Cloudinary Error:", error);
    
        throw error;
    
    }

};