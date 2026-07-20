// routes/internal.routes.js

import express from "express";

import { getDealSocketData } from "../controllers/deal.controller.js";

const router = express.Router();

router.get(
    "/deals/:dealId/socket-data",
    getDealSocketData
);

export default router;