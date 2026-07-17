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

export default app;