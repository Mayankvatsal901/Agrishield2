// ============================================================
// APP CONFIGURATION
// ============================================================

import express from "express";
import cors from "cors";
import blockchainRoutes from "./routes/blockchain.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    "/api/blockchain",
    blockchainRoutes
);

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        service: "Blockchain Service"

    });

});

export default app;