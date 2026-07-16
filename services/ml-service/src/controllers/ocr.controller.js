import * as ocrService from "../services/ocr.service.js";

export const extractKYC = async (req, res) => {

    try {

        const result = await ocrService.extractKYC(
            req.body.documents
        );

        return res.status(200).json({

            success: true,

            data: result,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};