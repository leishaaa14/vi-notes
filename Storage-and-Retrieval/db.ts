/**
 * db.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 *
 * MongoDB connection using Mongoose.
 * Call connectDB() once when the server starts.
 *
 * Set MONGODB_URI in your .env file:
 *   MONGODB_URI=mongodb://localhost:27017/vi-notes
 */

import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  await mongoose.connect(uri);
  isConnected = true;
  console.log("[vi-notes] MongoDB connected:", uri);
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("[vi-notes] MongoDB disconnected.");
}
