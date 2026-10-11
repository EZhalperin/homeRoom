import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

/**
 * Opens the MongoDB connection used by Mongoose models.
 * @returns {Promise<typeof mongoose>}
 */
export async function connectMongo() {
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
  });

  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
  return mongoose;
}

export { mongoose };
