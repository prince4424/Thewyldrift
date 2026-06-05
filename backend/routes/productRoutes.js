const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const requireAdmin = require("../middleware/auth");
const preventDuplicateSubmissions = require("../middleware/idempotency");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { productSchema } = require("../validators/productValidators");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", requireAdmin, preventDuplicateSubmissions, upload.any(), validate(productSchema), createProduct);
router.put("/:id", requireAdmin, preventDuplicateSubmissions, upload.any(), validate(productSchema), updateProduct);
router.delete("/:id", requireAdmin, preventDuplicateSubmissions, deleteProduct);

module.exports = router;
