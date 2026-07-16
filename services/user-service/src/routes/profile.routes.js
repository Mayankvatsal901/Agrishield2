import express from "express";

import authMiddleware from "../../../../shared/auth/auth.middleware.js";

import { createProfile, getProfile, updateProfile } from "../controllers/profile.controller.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createProfile
);
router.get(
    "/",
    authMiddleware,
    getProfile
);

router.put(
    "/",
    authMiddleware,
    updateProfile
);

export default router;