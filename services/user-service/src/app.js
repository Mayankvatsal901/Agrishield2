import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import profileRoutes from "./routes/profile.routes.js";
import kycRoutes from "./routes/kyc.routes.js";
import adminKYCRoutes from "./routes/admin.kyc.routes.js"
import internalRoutes from "./routes/internal.routes.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
app.use("/api/profile", profileRoutes);
app.use("/api/kyc", kycRoutes);

app.use("/api/admin/kyc", adminKYCRoutes);
app.use("/api/internal", internalRoutes);

// app.get("/", (req, res) => {

//     res.json({
//         success: true,
//         message: "User Service is Running 🚀"
//     });

// });

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