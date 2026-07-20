import express from "express";
import cors from "cors";

import dealRoutes from "./routes/deal.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import internalRoutes from "./routes/internal.routes.js" 


const app = express();


// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());


// ============================================================
// DEAL ROUTES
// ------------------------------------------------------------
// POST /api/deals
// Creates a new Deal Room.
// ============================================================

app.use(
    "/api/deals",
    dealRoutes
);

app.use(
    "/api/internal",
    internalRoutes
);


// ============================================================
// OFFER ROUTES
// ------------------------------------------------------------
// POST /api/deals/:dealId/offers
// Creates an offer inside a Deal Room.
//
// We use the same "/api/deals" base because offers belong
// to a specific Deal Room.
// ============================================================

app.use(
    "/api/deals",
    offerRoutes
);


export default app;