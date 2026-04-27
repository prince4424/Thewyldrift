const Joi = require("joi");

function csvToArray(value, helpers) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

const productSchema = Joi.object({
  productName: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().min(5).max(3000).required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).allow(null, "").default(null),
  category: Joi.string().trim().min(2).max(80).required(),
  stock: Joi.number().integer().min(0).required(),
  sku: Joi.string().trim().min(2).max(80).required(),
  sizes: Joi.any().custom(csvToArray).default([]),
  colors: Joi.any().custom(csvToArray).default([]),
  tags: Joi.any().custom(csvToArray).default([]),
  featured: Joi.boolean().truthy("true").falsy("false").default(false),
  active: Joi.boolean().truthy("true").falsy("false").default(true),
  existingImages: Joi.any().custom((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return [];
  }).default([]),
});

module.exports = { productSchema };
