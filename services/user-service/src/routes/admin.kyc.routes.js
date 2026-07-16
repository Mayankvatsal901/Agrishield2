import express from "express";

import authMiddleware from "../../../../shared/auth/auth.middleware.js";
import authorize from "../../../../shared/auth/role.middleware.js";

import {
    getAllKYC,
    getKYCDetails,
    approveKYC,
    rejectKYC,
} from "../controllers/admin.kyc.controller.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    getAllKYC
);

router.get(
    "/:userId",
    authMiddleware,
    authorize("ADMIN"),
    getKYCDetails
);

router.put(
    "/:userId/approve",
    authMiddleware,
    authorize("ADMIN"),
    approveKYC
);

router.put(
    "/:userId/reject",
    authMiddleware,
    authorize("ADMIN"),
    rejectKYC
);

export default router;