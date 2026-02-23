import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/sidewalk";

export const connectScriptDb = async (): Promise<void> => {
  await mongoose.connect(mongoUri);
};

export const disconnectScriptDb = async (): Promise<void> => {
  await mongoose.disconnect();
};
