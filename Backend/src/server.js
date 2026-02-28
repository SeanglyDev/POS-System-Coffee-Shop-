const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const app = require("./app");
const connectMongo = require("./config/db");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`🚀 Server running: http://localhost:${PORT}`);
        console.log(`📘 Swagger UI:     http://localhost:${PORT}/api-docs`);
    });
};

startServer();
