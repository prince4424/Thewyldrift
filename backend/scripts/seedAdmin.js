const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const connectDb = require("../config/db");

async function seedAdmin() {
  if (!process.env.ADMIN_PASSKEY) {
    throw new Error("ADMIN_PASSKEY is required in .env");
  }

  await connectDb({ throwOnError: true });

  const passkeyHash = await bcrypt.hash(process.env.ADMIN_PASSKEY, 12);

  await Admin.findOneAndUpdate(
    { role: "admin" },
    { role: "admin", passkeyHash },
    { upsert: true, new: true, runValidators: true }
  );

  console.log("Admin seeded with hashed passkey");
  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
