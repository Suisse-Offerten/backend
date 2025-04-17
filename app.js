require("./config/DBConnection");
const express = require("express");
const app = express();
const cors = require("cors");
const auth = require("./middlewares/auth");
const closeJob = require("./middlewares/closeJob");
const clientRouter = require("./routes/client-router");
const sellerRouter = require("./routes/seller.router");
const jobRouter = require("./routes/job-router");
const contactRouter = require("./routes/contact-router");
const communicationRouter = require("./routes/communication-router");
const reviewRouter = require("./routes/review-router");
const newsRouter = require("./routes/news-router");
const wishlistRouter = require("./routes/wishlist-router");
const paymentRouter = require("./routes/payment-router");
const offerRouter = require("./routes/offer-router");
const membershipRouter = require("./routes/membership-router");
const adminRouter = require("./routes/admin-router");
const creditRouter = require("./routes/credit-router");
const invoiceRouter = require("./routes/invoice-router");
const CORS_URL = process.env.CORS_URL;
const DASHBOARD_URL = process.env.DASHBOARD_URL;
const allowedOrigins = [CORS_URL, DASHBOARD_URL];
const cron = require("node-cron");
const {
  CORS_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
  ROUTE_NOT_FOUND_MESSAGE,
  HOME_ROUTE_MESSAGE,
} = require("./utils/response");
const WebhookRouter = require("./routes/webhook.router");

// App Use Middlewares
app.use("/webhook", WebhookRouter);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(CORS_ERROR_MESSAGE));
      }
    },
    credentials: true,
  })
);

cron.schedule("0 0 * * *", () => {
  closeJob();
});

// All Routes
app.use("/auth/client", clientRouter);
app.use("/auth/seller", sellerRouter);
app.use("/auth/job", jobRouter);
app.use("/auth/contact", contactRouter);
app.use("/auth/communication", communicationRouter);
app.use("/auth/review", reviewRouter);
app.use("/auth/news", newsRouter);
app.use("/auth/wishlist", wishlistRouter);
app.use("/auth/payment", paymentRouter);
app.use("/auth/offer", offerRouter);
app.use("/auth/membership", membershipRouter);
app.use("/auth/admin", adminRouter);
app.use("/auth/credit", creditRouter);
app.use("/auth/invoice", invoiceRouter);

// Home Route
app.get("/", auth, (req, res) => {
  res.send(HOME_ROUTE_MESSAGE);
});

// Route not founf
app.use((req, res, next) => {
  res.send(ROUTE_NOT_FOUND_MESSAGE);
  next();
});

// Server error
app.use((req, res, next, err) => {
  if (err) {
    return err;
  } else {
    res.send(SERVER_ERROR_MESSAGE);
  }
  next();
});

module.exports = app;
