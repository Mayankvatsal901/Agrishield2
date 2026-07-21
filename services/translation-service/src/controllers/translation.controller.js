import * as translationService
from "../services/translation.service.js";

export const translate = async (req, res) => {

    try {

        const result =
            await translationService.translate(req.body);

        return res.status(200).json({

            success: true,

            data: result,

        });

    }

    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

export const speechToTextController = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Audio file is required.",

            });

        }

        const result =
            await translationService.speechToText(req.file);

        return res.status(200).json({

            success: true,

            data: result,

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};