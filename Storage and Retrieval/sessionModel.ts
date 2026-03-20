/**
 * sessionModel.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 *
 * Mongoose schema that links written content to a user and all
 * captured typing metadata (paste events from Feature #4,
 * keystroke timing from Feature #3).
 */

import mongoose, { Document, Schema } from "mongoose";

// ─── Embedded types (mirrors Feature #4 output) ──────────────────────────────

export interface PasteEventRecord {
  timestamp: string;
  pastedLength: number;
  pastedPreview: string;
  cursorPosition: number;
  sessionPasteCount: number;
  sessionPastedChars: number;
}

export interface PasteSummaryRecord {
  totalPasteEvents: number;
  totalPastedChars: number;
  pasteRatio: number;
  pasteEvents: PasteEventRecord[];
}

// Keystroke timing from Feature #3
export interface KeystrokeRecord {
  key: string;
  timestamp: string;
  dwellTime: number;   // ms key was held down
  flightTime: number;  // ms between this and previous keypress
}

export interface KeystrokeSummaryRecord {
  totalKeystrokes: number;
  averageFlightTime: number;
  keystrokeEvents: KeystrokeRecord[];
}

// ─── Main session interface ───────────────────────────────────────────────────

export interface ISession extends Document {
  /** Links session to a registered user */
  userId: string;
  /** The full written text */
  content: string;
  /** Word count derived from content */
  wordCount: number;
  /** Character count of the content */
  charCount: number;
  /** Paste detection data from Feature #4 */
  pasteData: PasteSummaryRecord;
  /** Keystroke timing data from Feature #3 */
  keystrokeData: KeystrokeSummaryRecord;
  /** ISO timestamp when session was first saved */
  createdAt: Date;
  /** ISO timestamp of last update */
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const PasteEventSchema = new Schema<PasteEventRecord>(
  {
    timestamp: { type: String, required: true },
    pastedLength: { type: Number, required: true },
    pastedPreview: { type: String, default: "" },
    cursorPosition: { type: Number, default: -1 },
    sessionPasteCount: { type: Number, required: true },
    sessionPastedChars: { type: Number, required: true },
  },
  { _id: false }
);

const PasteSummarySchema = new Schema<PasteSummaryRecord>(
  {
    totalPasteEvents: { type: Number, default: 0 },
    totalPastedChars: { type: Number, default: 0 },
    pasteRatio: { type: Number, default: 0 },
    pasteEvents: { type: [PasteEventSchema], default: [] },
  },
  { _id: false }
);

const KeystrokeEventSchema = new Schema<KeystrokeRecord>(
  {
    key: { type: String, required: true },
    timestamp: { type: String, required: true },
    dwellTime: { type: Number, default: 0 },
    flightTime: { type: Number, default: 0 },
  },
  { _id: false }
);

const KeystrokeSummarySchema = new Schema<KeystrokeSummaryRecord>(
  {
    totalKeystrokes: { type: Number, default: 0 },
    averageFlightTime: { type: Number, default: 0 },
    keystrokeEvents: { type: [KeystrokeEventSchema], default: [] },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
    charCount: { type: Number, default: 0 },
    pasteData: { type: PasteSummarySchema, default: () => ({}) },
    keystrokeData: { type: KeystrokeSummarySchema, default: () => ({}) },
  },
  {
    timestamps: true, // auto-manages createdAt and updatedAt
    collection: "sessions",
  }
);

// Index for fast user session lookups
SessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);
