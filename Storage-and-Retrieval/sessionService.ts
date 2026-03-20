/**
 * sessionService.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 *
 * Functions to save and retrieve writing sessions from MongoDB.
 * Designed to be called from the editor on session end or autosave.
 *
 * Usage:
 *   await saveSession({ userId, content, pasteData, keystrokeData });
 *   const sessions = await getSessionsByUser("user_123");
 *   const session  = await getSessionById("abc123");
 */

import { Session, ISession, PasteSummaryRecord, KeystrokeSummaryRecord } from "./sessionModel";

// ─── Input types ─────────────────────────────────────────────────────────────

export interface SaveSessionInput {
  userId: string;
  content: string;
  pasteData?: Partial<PasteSummaryRecord>;
  keystrokeData?: Partial<KeystrokeSummaryRecord>;
}

export interface SessionSummary {
  id: string;
  userId: string;
  wordCount: number;
  charCount: number;
  pasteRatio: number;
  totalPasteEvents: number;
  totalKeystrokes: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function toSummary(session: ISession): SessionSummary {
  return {
    id: (session._id as unknown as string).toString(),
    userId: session.userId,
    wordCount: session.wordCount,
    charCount: session.charCount,
    pasteRatio: session.pasteData?.pasteRatio ?? 0,
    totalPasteEvents: session.pasteData?.totalPasteEvents ?? 0,
    totalKeystrokes: session.keystrokeData?.totalKeystrokes ?? 0,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Save a new writing session to MongoDB.
 * Word count and char count are derived automatically from content.
 */
export async function saveSession(input: SaveSessionInput): Promise<ISession> {
  const { userId, content, pasteData = {}, keystrokeData = {} } = input;

  const session = new Session({
    userId,
    content,
    wordCount: countWords(content),
    charCount: content.length,
    pasteData: {
      totalPasteEvents: 0,
      totalPastedChars: 0,
      pasteRatio: 0,
      pasteEvents: [],
      ...pasteData,
    },
    keystrokeData: {
      totalKeystrokes: 0,
      averageFlightTime: 0,
      keystrokeEvents: [],
      ...keystrokeData,
    },
  });

  return await session.save();
}

/**
 * Update an existing session — useful for autosave during writing.
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<SaveSessionInput>
): Promise<ISession | null> {
  const patch: Partial<ISession> = {};

  if (updates.content !== undefined) {
    patch.content = updates.content;
    patch.wordCount = countWords(updates.content);
    patch.charCount = updates.content.length;
  }
  if (updates.pasteData) patch.pasteData = updates.pasteData as PasteSummaryRecord;
  if (updates.keystrokeData) patch.keystrokeData = updates.keystrokeData as KeystrokeSummaryRecord;

  return await Session.findByIdAndUpdate(sessionId, patch, { new: true });
}

/**
 * Retrieve all sessions for a given user, newest first.
 */
export async function getSessionsByUser(userId: string): Promise<SessionSummary[]> {
  const sessions = await Session.find({ userId })
    .sort({ createdAt: -1 })
    .select("-content -pasteData.pasteEvents -keystrokeData.keystrokeEvents")
    .lean<ISession[]>();

  return sessions.map(toSummary);
}

/**
 * Retrieve a single session by ID including full content and metadata.
 */
export async function getSessionById(sessionId: string): Promise<ISession | null> {
  return await Session.findById(sessionId);
}

/**
 * Delete a session by ID.
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const result = await Session.findByIdAndDelete(sessionId);
  return result !== null;
}
