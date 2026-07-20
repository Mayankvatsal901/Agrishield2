import express from "express";
import cors from "cors";

import translationRoutes from "./routes/translation.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", translationRoutes);

export default app;