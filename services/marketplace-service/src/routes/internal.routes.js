import express from "express";

import {
    getProductForInternalService,
} from "../controllers/internal.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| INTERNAL PRODUCT API
|--------------------------------------------------------------------------
| GET /api/internal/products/:productId
|
| Used by Deal Service to fetch product information.
|--------------------------------------------------------------------------
*/

router.get(
    "/products/:productId",
    getProductForInternalService
);

export default router;