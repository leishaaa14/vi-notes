/**
 * sessionService.test.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 * Run with: npx jest sessionService.test.ts
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  saveSession,
  updateSession,
  getSessionsByUser,
  getSessionById,
  deleteSession,
} from "./sessionService";

let mongoServer: MongoMemoryServer;

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear the sessions collection between tests
  await mongoose.connection.collection("sessions").deleteMany({});
});

// ─── saveSession ──────────────────────────────────────────────────────────────

describe("saveSession", () => {
  it("saves a session and returns it with an _id", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "Hello world",
    });
    expect(session._id).toBeDefined();
    expect(session.userId).toBe("user_001");
    expect(session.content).toBe("Hello world");
  });

  it("calculates wordCount correctly", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "The quick brown fox",
    });
    expect(session.wordCount).toBe(4);
  });

  it("calculates charCount correctly", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "Hello",
    });
    expect(session.charCount).toBe(5);
  });

  it("stores pasteData when provided", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "Some content",
      pasteData: {
        totalPasteEvents: 2,
        totalPastedChars: 50,
        pasteRatio: 0.25,
        pasteEvents: [],
      },
    });
    expect(session.pasteData.totalPasteEvents).toBe(2);
    expect(session.pasteData.pasteRatio).toBe(0.25);
  });

  it("stores keystrokeData when provided", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "Typed content",
      keystrokeData: {
        totalKeystrokes: 100,
        averageFlightTime: 120,
        keystrokeEvents: [],
      },
    });
    expect(session.keystrokeData.totalKeystrokes).toBe(100);
    expect(session.keystrokeData.averageFlightTime).toBe(120);
  });

  it("defaults pasteData and keystrokeData to empty when not provided", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "Minimal session",
    });
    expect(session.pasteData.totalPasteEvents).toBe(0);
    expect(session.keystrokeData.totalKeystrokes).toBe(0);
  });

  it("sets createdAt and updatedAt timestamps", async () => {
    const session = await saveSession({
      userId: "user_001",
      content: "Timestamp test",
    });
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.updatedAt).toBeInstanceOf(Date);
  });
});

// ─── updateSession ────────────────────────────────────────────────────────────

describe("updateSession", () => {
  it("updates content and recalculates wordCount", async () => {
    const original = await saveSession({ userId: "user_001", content: "Old content" });
    const updated = await updateSession(original._id.toString(), {
      content: "New content with more words",
    });
    expect(updated?.content).toBe("New content with more words");
    expect(updated?.wordCount).toBe(5);
  });

  it("returns null for a non-existent session ID", async () => {
    const result = await updateSession(
      new mongoose.Types.ObjectId().toString(),
      { content: "ghost" }
    );
    expect(result).toBeNull();
  });
});

// ─── getSessionsByUser ────────────────────────────────────────────────────────

describe("getSessionsByUser", () => {
  it("returns only sessions belonging to the given user", async () => {
    await saveSession({ userId: "user_A", content: "User A session" });
    await saveSession({ userId: "user_B", content: "User B session" });

    const results = await getSessionsByUser("user_A");
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe("user_A");
  });

  it("returns sessions newest first", async () => {
    await saveSession({ userId: "user_A", content: "First" });
    await new Promise((r) => setTimeout(r, 10));
    await saveSession({ userId: "user_A", content: "Second" });

    const results = await getSessionsByUser("user_A");
    expect(results[0].createdAt >= results[1].createdAt).toBe(true);
  });

  it("returns empty array when user has no sessions", async () => {
    const results = await getSessionsByUser("no_such_user");
    expect(results).toHaveLength(0);
  });
});

// ─── getSessionById ───────────────────────────────────────────────────────────

describe("getSessionById", () => {
  it("retrieves a session by its ID with full content", async () => {
    const saved = await saveSession({ userId: "user_001", content: "Full content here" });
    const retrieved = await getSessionById(saved._id.toString());
    expect(retrieved?.content).toBe("Full content here");
  });

  it("returns null for a non-existent ID", async () => {
    const result = await getSessionById(new mongoose.Types.ObjectId().toString());
    expect(result).toBeNull();
  });
});

// ─── deleteSession ────────────────────────────────────────────────────────────

describe("deleteSession", () => {
  it("deletes a session and returns true", async () => {
    const session = await saveSession({ userId: "user_001", content: "Delete me" });
    const result = await deleteSession(session._id.toString());
    expect(result).toBe(true);

    const check = await getSessionById(session._id.toString());
    expect(check).toBeNull();
  });

  it("returns false for a non-existent session", async () => {
    const result = await deleteSession(new mongoose.Types.ObjectId().toString());
    expect(result).toBe(false);
  });
});
