const mongoose = require("mongoose");

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "MongoDB is not connected. Start MongoDB or update MONGODB_URI in .env.",
    });
  }
  return next();
}

module.exports = requireDb;
