import * as productService from "../services/product.service.js";

export const createProduct = async (req, res) => {

    try {

        const product = await productService.createProduct(
            req
        );

        return res.status(201).json({

            success: true,

            message: "Product Added Successfully",

            data: product,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

export const getMyProducts = async (req, res) => {

    try {

        const products = await productService.getMyProducts(
            req.user.userId
        );

        return res.status(200).json({

            success: true,

            data: products,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

export const getProductById = async (req, res) => {

    try {

        const product = await productService.getProductById(
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
export const updateProduct = async (req, res) => {

    try {

        const product = await productService.updateProduct(req);

        return res.status(200).json({

            success: true,

            message: "Product updated successfully.",

            data: product,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

export const deleteProduct = async (req, res) => {

    try {

        await productService.deleteProduct(req);

        return res.status(200).json({

            success: true,

            message: "Product deleted successfully.",

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};


