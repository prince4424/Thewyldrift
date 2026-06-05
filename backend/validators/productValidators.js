const Joi = require("joi");
const { PRODUCT_CATEGORIES } = require("../constants/productCategories");
const { ALLOWED_SIZES } = require("../models/Product");

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return JSON.parse(value);
  }
  return [];
}

const variantImageSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().required(),
});

const variantSchema = Joi.object({
  _id: Joi.string().optional().allow(""),
  stock: Joi.number().integer().min(0).required(),
  sku: Joi.string().trim().min(2).max(80).required(),
  color: Joi.string().trim().min(1).max(60).required(),
  size: Joi.string()
    .valid(...ALLOWED_SIZES)
    .required(),
  existingImage: variantImageSchema.optional(),
});

const bannerImageRowSchema = Joi.object({
  existingImage: variantImageSchema.optional(),
});

const productSchema = Joi.object({
  productName: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().min(5).max(3000).required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).allow(null, "").default(null),
  category: Joi.string()
    .trim()
    .valid(...PRODUCT_CATEGORIES)
    .required(),
  variants: Joi.any()
    .custom((value, helpers) => {
      let parsed;
      try {
        parsed = parseJsonArray(value);
      } catch {
        return helpers.error("any.invalid");
      }

      if (!Array.isArray(parsed) || parsed.length < 1) {
        return helpers.message("At least one variant row is required");
      }

      const { error, value: validated } = Joi.array().items(variantSchema).validate(parsed, {
        abortEarly: false,
      });

      if (error) {
        return helpers.message(error.details.map((d) => d.message).join("; "));
      }

      const sizeKeys = validated.map((v) => `${v.sku}:${v.size}:${v.color}`.toLowerCase());
      if (new Set(sizeKeys).size !== sizeKeys.length) {
        return helpers.message("Each variant must have a unique SKU, size, and color combination");
      }

      return validated;
    })
    .required(),
  bannerImages: Joi.any()
    .custom((value) => {
      if (value === undefined || value === null || value === "") {
        return [];
      }

      let parsed;
      try {
        parsed = parseJsonArray(value);
      } catch {
        throw new Error("Invalid banner images payload");
      }

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid banner images payload");
      }

      if (parsed.length > 5) {
        throw new Error("At most 5 banner images are allowed");
      }

      const { error } = Joi.array().items(bannerImageRowSchema).max(5).validate(parsed, {
        abortEarly: false,
      });

      if (error) {
        throw new Error(error.details.map((d) => d.message).join("; "));
      }

      return parsed;
    })
    .default([]),
  tags: Joi.any()
    .custom((value) => {
      if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    })
    .default([]),
  featured: Joi.boolean().truthy("true").falsy("false").default(false),
  active: Joi.boolean().truthy("true").falsy("false").default(true),
});

module.exports = { productSchema, ALLOWED_SIZES };
