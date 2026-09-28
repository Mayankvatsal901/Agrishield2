import express from "express";
import cors from "cors";

import productRoutes from "./routes/product.routes.js";
import marketplaceRoutes from "./routes/marketplace.routes.js";
import internalRoutes from "./routes/internal.routes.js";
const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/products", productRoutes);
app.use(
    "/api/marketplace",
    marketplaceRoutes
);

app.use(
    "/api/internal",
    internalRoutes
);

// ============================================================
// ERROR HANDLER
// ------------------------------------------------------------
// Turns any error (including Cloudinary's plain-object errors)
// into readable JSON. Upstream failures become 502, never 401,
// so the frontend doesn't mistake them for an expired login.
// ============================================================
app.use((err, req, res, next) => {
    const message =
        err?.message ||
        err?.error?.message ||
        (typeof err === "string" ? err : JSON.stringify(err));

    console.error("❌ Request error:", err);

    const status = err?.http_code ? 502 : err?.status || 500;

    res.status(status).json({
        success: false,
        message,
    });
});

export default app;