import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5008;

app.listen(PORT, () => {

    console.log(`🚀 ML Service running on port ${PORT}`);

});