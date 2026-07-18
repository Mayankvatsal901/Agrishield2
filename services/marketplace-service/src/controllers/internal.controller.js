import * as internalService from "../services/internal.service.js";

/*
|--------------------------------------------------------------------------
| GET PRODUCT DETAILS - INTERNAL API
|--------------------------------------------------------------------------
| Used by other microservices such as Deal Service.
|--------------------------------------------------------------------------
*/

export const getProductForInternalService = async (req, res) => {

    try {

        const product =
            await internalService.getProductForInternalService(
                req.params.productId
            );

        return res.status(200).json({
            success: true,
            data: product,
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message,
        });

    }
};