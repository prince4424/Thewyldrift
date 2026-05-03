function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.name === "MulterError") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate value already exists",
      fields: Object.keys(error.keyValue || {}),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid resource id" });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server error",
  });
}

module.exports = errorHandler;
