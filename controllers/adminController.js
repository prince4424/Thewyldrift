const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

async function loginAdmin(req, res, next) {
  try {
    const admin = await Admin.findOne({ role: "admin" }).select("+passkeyHash");

    if (!admin) {
      return res.status(401).json({ success: false, message: "Admin is not initialized" });
    }

    const isMatch = await bcrypt.compare(req.body.passkey, admin.passkeyHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid passkey" });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { loginAdmin };
