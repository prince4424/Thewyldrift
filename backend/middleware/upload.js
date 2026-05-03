const multer = require("multer");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    files: 8,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Only JPG, PNG, WEBP, and AVIF images are allowed"));
      return;
    }

    cb(null, true);
  },
});

module.exports = upload;
