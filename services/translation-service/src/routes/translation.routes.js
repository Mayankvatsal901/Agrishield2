import express from "express";

import {
    translate
} from "../controllers/translation.controller.js";

const router = express.Router();

router.post(
    "/translate",
    translate
);

export default router;