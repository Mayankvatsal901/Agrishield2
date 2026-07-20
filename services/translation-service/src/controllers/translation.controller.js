import * as translationService
from "../services/translation.service.js";

export const translate = async (
    req,
    res
) => {

    try {

        const result =
            await translationService.translate(
                req.body
            );

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