import express from "express";

import authMiddleware from "../../../../shared/middleware/authMiddleware.js";

import { getMarketplaceEligibility } from "../controllers/internal.controller.js";

const router = express.Router();

router.get(

    "/farmer/eligibility",

    authMiddleware,

    getMarketplaceEligibility

);

export default router;