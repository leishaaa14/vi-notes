/**
 * server.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 * Simple Express server that serves the demo frontend and API routes.
 *
 * Run with: npx ts-node server.ts
 */
import "dotenv/config";
import express from "express";
import path from "path";
import { connectDB } from "./db";
import sessionRoutes from "./sessionRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));
app.use("/api/sessions", sessionRoutes);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "demo.html"));
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[vi-notes] Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("[vi-notes] Failed to connect to MongoDB:", err.message);
  process.exit(1);
});
