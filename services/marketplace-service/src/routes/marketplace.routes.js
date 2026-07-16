import express from "express";

import {
    browseMarketplace,
    getProductDetails,
} from "../controllers/marketplace.controller.js";

const router = express.Router();

router.get(
    "/",
    browseMarketplace
);

router.get(
    "/:productId",
    getProductDetails
);

export default router;