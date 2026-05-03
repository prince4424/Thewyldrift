const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
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

/** Set SERVE_STATIC=1 in .env only if you want this process to host the built React app from frontend/dist. */
const serveStatic = process.env.SERVE_STATIC === "1";
const clientDist = path.join(__dirname, "..", "frontend", "dist");

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

if (serveStatic) {
  app.use(express.static(clientDist));
}

// ✅ API health
app.get("/api", (req, res) => {
  res.json({ success: true, message: "API running" });
});

// ✅ Routes
app.use("/api/admin", requireDb, adminRoutes);
app.use("/api/products", requireDb, productRoutes);
app.use("/api/settings", requireDb, settingsRoutes);

if (serveStatic) {
  app.get(["/", "/admin", "/admin.html", "/index.html"], (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  app.get("/product/:id", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    const devUi = process.env.FRONTEND_DEV_URL || "http://localhost:5173";
    res.json({
      success: true,
      message: "The Wyldrift API (no UI on this server).",
      api: "/api",
      storefrontUrl: devUi,
      adminUrl: `${devUi.replace(/\/$/, "")}/admin`,
      hint: "Open storefrontUrl or adminUrl for the React app (npm run dev in frontend). This port is /api only unless SERVE_STATIC=1.",
    });
  });
}

// ✅ 404
app.use((req, res) => {
  const message = serveStatic
    ? "Route not found"
    : "Route not found. This server only exposes /api/*. Use the Vite dev server for the storefront.";
  const body = { success: false, message };
  if (!serveStatic) {
    const devUi = process.env.FRONTEND_DEV_URL || "http://localhost:5173";
    body.storefrontUrl = devUi;
    body.adminUrl = `${devUi.replace(/\/$/, "")}/admin`;
    body.hint =
      process.env.NODE_ENV === "production"
        ? "Host the built app with SERVE_STATIC=1, or put the SPA behind the same origin as /api."
        : `Open the React app at ${devUi} (shop: /, admin: /admin). This port is API-only unless SERVE_STATIC=1.`;
  }
  res.status(404).json(body);
});

// ✅ Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await connectDb({ throwOnError: process.env.NODE_ENV === "production" });
  } catch (error) {
    console.error("Continuing without DB connection:", error?.message || error);
  }
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if (serveStatic) {
      console.log("Mode: API + static UI (SERVE_STATIC=1, frontend/dist).");
    } else {
      console.log("Mode: API only. No frontend/dist (set SERVE_STATIC=1 to enable).");
      console.log("UI in dev: cd ../frontend && npm run dev → open the printed URL (e.g. /admin), not this port for HTML.");
    }
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
