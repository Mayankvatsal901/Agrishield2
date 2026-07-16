import express from "express";

import authMiddleware from "../../../../shared/auth/auth.middleware.js";

import authorize from "../../../../shared/auth/role.middleware.js";

import upload from "../../../../shared/cloudinary/upload.middleware.js";

import {

    createProduct,getMyProducts,getProductById,updateProduct,deleteProduct

} from "../controllers/product.controller.js";

const router = express.Router();

router.post(

    "/",

    authMiddleware,

    authorize("FARMER"),

    upload.array("images", 5),

    createProduct

);
router.get(
    "/my",
    authMiddleware,
    authorize("FARMER"),
    getMyProducts
);


router.get("/:productId", getProductById);

router.put(
    "/:productId",
    authMiddleware,
    authorize("FARMER"),
    upload.array("images",5),
    updateProduct
);

router.delete(
    "/:productId",
    authMiddleware,
    authorize("FARMER"),
    deleteProduct
);



export default router;