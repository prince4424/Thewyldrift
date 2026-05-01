const express = require("express");
const rateLimit = require("express-rate-limit");
const { loginAdmin } = require("../controllers/adminController");
const { upsertSettings, getSettings } = require("../controllers/settingsController");
const requireAdmin = require("../middleware/auth");
const validate = require("../middleware/validate");
const { loginSchema } = require("../validators/adminValidators");
const { settingsSchema } = require("../validators/settingsValidators");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post("/login", loginLimiter, validate(loginSchema), loginAdmin);

// Homepage / site settings
router.get("/settings", requireAdmin, getSettings);
router.put("/settings", requireAdmin, validate(settingsSchema), upsertSettings);

module.exports = router;
