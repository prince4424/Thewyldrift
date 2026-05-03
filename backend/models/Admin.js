const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "admin",
      unique: true,
      immutable: true,
    },
    passkeyHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
