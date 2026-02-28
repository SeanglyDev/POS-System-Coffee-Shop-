const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require("./middleware/error.middleware");

const setupSwagger = require('./config/swagger');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
setupSwagger(app);
// register user 
const registerRoutes = require("./routes/register.route");
app.use("/api/users", registerRoutes);
// login users
const loginRoutes = require("./routes/login.route")
app.use("/api/user", loginRoutes)
// categories
const categoriesRoutes = require("./routes/categories.route");
app.use("/api/categories", categoriesRoutes)

const stockRoutes = require("./routes/stock.route");
app.use("/api/stock", stockRoutes);

const productRoutes = require("./routes/product.route");
app.use("/api/product", productRoutes)

const orderRoutes = require("./routes/order.route");
app.use("/api/order", orderRoutes);

const paymentRoutes = require("./routes/payment.route")
app.use("/api/payment", paymentRoutes);

const auth = require("./routes/auth.route")
app.use("/api/auth",auth);

app.get('/', (req, res) => {
    res.send('Hello Welcome to My API Coffee Ordering');
});

app.use(errorHandler);

module.exports = app;

