const Joi = require("joi");
const { PRODUCT_CATEGORIES } = require("../constants/productCategories");

const footerLinkSchema = Joi.object({
  label: Joi.string().trim().min(2).max(40).required(),
  href: Joi.string().trim().min(1).max(200).required(),
});

const settingsSchema = Joi.object({
  homeCategoryTitle: Joi.string().trim().min(2).max(40),
  homeCategoryKicker: Joi.string().trim().min(2).max(20),
  homeLatestTitle: Joi.string().trim().min(2).max(60),
  homeFeaturedCategory: Joi.string()
    .trim()
    .valid(...PRODUCT_CATEGORIES),
  cartBadge: Joi.number().integer().min(0).max(999),
  footerLinks: Joi.array().items(footerLinkSchema).min(1).max(8),
});

module.exports = { settingsSchema };

