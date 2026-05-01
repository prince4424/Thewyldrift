require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");

const connectDb = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const errorHandler = require("./middleware/errorHandler");
const requireDb = require("./middleware/requireDb");

const app = express();

// Render (and most PaaS) terminate TLS at the proxy/load balancer.
// Trust the proxy so we can safely read forwarded headers.
app.set("trust proxy", 1);

// ✅ Security
app.use(helmet({ contentSecurityPolicy: false }));

// ✅ CORS (fixed)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      const allowed = new Set(["https://thewyldrift.in"]);
      return callback(null, allowed.has(origin));
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// ✅ Static frontend (React build)
const clientDist = path.join(__dirname, "client", "dist");
app.use(express.static(clientDist));

// ✅ API health
app.get("/api", (req, res) => {
  res.json({ success: true, message: "API running" });
});

// ✅ Routes
app.use("/api/admin", requireDb, adminRoutes);
app.use("/api/products", requireDb, productRoutes);
app.use("/api/settings", requireDb, settingsRoutes);

// ✅ Serve frontend (SPA)
// Keep this BELOW API routes so `/api/*` is not captured.
app.get(["/", "/admin", "/admin.html", "/index.html"], (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ✅ Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

async function start() {
  // Keep the UI reachable even if Mongo is temporarily unavailable.
  // API routes already gate on DB connectivity via `requireDb`.
  try {
    await connectDb({ throwOnError: process.env.NODE_ENV === "production" });
  } catch (error) {
    console.error("Continuing without DB connection:", error?.message || error);
  }
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  module.exports = app;
}