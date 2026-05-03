const mongoose = require("mongoose");

async function connectDb(options = {}) {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required in .env");
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    const { host, name } = connection.connection;
    console.log(`MongoDB connected: ${host} (database: "${name}")`);
    if (name === "thewyldrift") {
      console.warn(
        'MongoDB is using the default database "thewyldrift". If your Atlas data lives under another name (e.g. "thewyldrift"), put it in MONGODB_URI before ?… e.g. …mongodb.net/thewyldrift?retryWrites=true&w=majority — otherwise /api/products will stay empty.'
      );
    }
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (options.throwOnError) {
      throw error;
    }
  }
}

module.exports = connectDb;
