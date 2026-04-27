const express = require("express");
const rateLimit = require("express-rate-limit");
const { loginAdmin } = require("../controllers/adminController");
const validate = require("../middleware/validate");
const { loginSchema } = require("../validators/adminValidators");

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

module.exports = router;
