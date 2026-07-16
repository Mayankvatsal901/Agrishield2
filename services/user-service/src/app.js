import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import profileRoutes from "./routes/profile.routes.js";
import kycRoutes from "./routes/kyc.routes.js";
import adminKYCRoutes from "./routes/admin.kyc.routes.js"

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

// app.get("/", (req, res) => {

//     res.json({
//         success: true,
//         message: "User Service is Running 🚀"
//     });

// });

export default app;