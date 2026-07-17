// ============================================================
// CONTRACT SERVICE APP
// ------------------------------------------------------------
// Initializes the Express application.
//
// Currently this service works mainly through RabbitMQ
// consumers (background events), so no REST routes are
// registered yet.
//
// Future REST APIs:
// - GET /api/contracts/:id
// - GET /api/contracts/deal/:dealId
// - GET /api/contracts/download/:id
// ============================================================

import express from "express";
import cors from "cors";

const app = express();

// Allow requests from frontend/API Gateway
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// ============================================================
// Future Routes
// ============================================================

// import contractRoutes from "./routes/contract.routes.js";
// app.use("/api/contracts", contractRoutes);

export default app;