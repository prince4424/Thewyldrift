const mongoose = require("mongoose");

async function connectDb(options = {}) {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required in .env");
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (options.throwOnError) {
      throw error;
    }
  }
}

module.exports = connectDb;
