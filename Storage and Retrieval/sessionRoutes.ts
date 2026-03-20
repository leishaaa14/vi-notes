/**
 * sessionRoutes.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 *
 * Express routes for saving and retrieving writing sessions.
 * Mount in your main Express app:
 *
 *   import sessionRoutes from "./sessionRoutes";
 *   app.use("/api/sessions", sessionRoutes);
 */

import { Router, Request, Response } from "express";
import {
  saveSession,
  updateSession,
  getSessionsByUser,
  getSessionById,
  deleteSession,
} from "./sessionService";

const router = Router();

// POST /api/sessions — save a new session
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, content, pasteData, keystrokeData } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: "userId and content are required." });
    }

    const session = await saveSession({ userId, content, pasteData, keystrokeData });
    return res.status(201).json({ session });
  } catch (err) {
    console.error("[vi-notes] saveSession error:", err);
    return res.status(500).json({ error: "Failed to save session." });
  }
});

// PATCH /api/sessions/:id — update an existing session (autosave)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { content, pasteData, keystrokeData } = req.body;
    const session = await updateSession(req.params.id, {
      content,
      pasteData,
      keystrokeData,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.json({ session });
  } catch (err) {
    console.error("[vi-notes] updateSession error:", err);
    return res.status(500).json({ error: "Failed to update session." });
  }
});

// GET /api/sessions?userId=xxx — get all sessions for a user
router.get("/", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId query parameter is required." });
    }

    const sessions = await getSessionsByUser(userId);
    return res.json({ sessions });
  } catch (err) {
    console.error("[vi-notes] getSessionsByUser error:", err);
    return res.status(500).json({ error: "Failed to retrieve sessions." });
  }
});

// GET /api/sessions/:id — get a single session with full content
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const session = await getSessionById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.json({ session });
  } catch (err) {
    console.error("[vi-notes] getSessionById error:", err);
    return res.status(500).json({ error: "Failed to retrieve session." });
  }
});

// DELETE /api/sessions/:id — delete a session
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await deleteSession(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.json({ message: "Session deleted." });
  } catch (err) {
    console.error("[vi-notes] deleteSession error:", err);
    return res.status(500).json({ error: "Failed to delete session." });
  }
});

export default router;
