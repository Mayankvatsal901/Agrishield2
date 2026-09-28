// ============================================================
// CONTRACT SERVICE APP
// ------------------------------------------------------------
// Background work happens through RabbitMQ (see subscriber.js
// and pdf.worker.js). These REST routes let the frontend look
// up a contract directly.
// ============================================================

import express from "express";
import cors from "cors";
import contractRoutes from "./routes/contract.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ success: true, service: "contract" }));
app.use("/api/contracts", contractRoutes);

// Readable JSON errors instead of HTML pages
app.use((err, req, res, next) => {
    console.error("❌", err);
    res.status(500).json({ success: false, message: err.message || "Something went wrong" });
});

export default app;