import express from "express";

import authMiddleware from "../../../../shared/middleware/authMiddleware.js";

import { getMarketplaceEligibility,getInternalUser } from "../controllers/internal.controller.js";

const router = express.Router();

router.get(

    "/farmer/eligibility",

    authMiddleware,

    getMarketplaceEligibility

);

router.get(
    "/users/:id",
    getInternalUser
);

export default router;