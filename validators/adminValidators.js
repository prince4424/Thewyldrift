const Joi = require("joi");

const loginSchema = Joi.object({
  passkey: Joi.string().trim().min(6).max(128).required(),
});

module.exports = { loginSchema };
