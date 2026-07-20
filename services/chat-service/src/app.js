import express from "express";
import cors from "cors";

import chatRoutes from "./routes/chat.routes.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Middlewares
|--------------------------------------------------------------------------
*/
console.log("✅ App.js loaded");
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
    res.json({
        service: "THIS IS MY CHAT SERVICE"
    });
});;

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------


*/
console.log("✅ Mounting chat routes");

app.use("/api/chats", chatRoutes);

export default app;