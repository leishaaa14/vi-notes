import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./db";
import sessionRoutes from "./sessionRoutes";
 
const app = express();
const PORT = process.env.PORT || 3000;
 
app.use(cors());
app.use(express.json());
app.use(express.static("."));
app.use("/api/sessions", sessionRoutes);
 
app.get("/", (_req, res) => {
  res.sendFile(path.resolve("demo.html"));
});
 
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[vi-notes] Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("[vi-notes] Failed to connect to MongoDB:", err.message);
  process.exit(1);
});
