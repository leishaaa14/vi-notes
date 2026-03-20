# Vi-Notes — Feature #5: Save Writing Session Data

This module implements writing session storage for the [Vi-Notes](https://github.com/vicharanashala/vi-notes) project. Each writing session saves the composed text linked to a user, along with paste detection data from Feature #4 and keystroke timing data from Feature #3 — giving the authenticity engine a complete record of how the content was written.

## Available Scripts

### `npm test`

Runs all unit tests using an in-memory MongoDB instance (no real database needed).\
Tests cover saving, updating, retrieving, and deleting sessions.

```
Tests: 13 passed, 13 total
```

### `npm run build`

Compiles TypeScript to JavaScript in the `dist/` folder.

## Project Structure

```
session-storage/
├── sessionModel.ts          # Mongoose schema — defines the session data structure
├── sessionService.ts        # Save, update, retrieve, delete sessions
├── sessionRoutes.ts         # Express API routes (/api/sessions)
├── useSessionStorage.ts     # React hook for editor integration
├── db.ts                    # MongoDB connection helper
├── sessionService.test.ts   # 13 unit tests
└── README.md
```

## How It Connects to Other Features

```
Feature #3 (Keystroke Timing)  ──┐
                                  ├──▶  sessionService.saveSession()  ──▶  MongoDB
Feature #4 (Paste Detection)   ──┘
```

The `saveSession()` function accepts both `pasteData` (from `buildPasteSummary()` in Feature #4) and `keystrokeData` directly, storing them in the same MongoDB document as the written content.

## API

### `saveSession(input)`

Saves a new writing session to MongoDB.

```ts
const session = await saveSession({
  userId: "user_123",
  content: "The essay text goes here...",
  pasteData: buildPasteSummary(detector, content.length),
  keystrokeData: { totalKeystrokes: 240, averageFlightTime: 115, keystrokeEvents: [] },
});
```

### `updateSession(sessionId, updates)`

Updates an existing session — used for autosave during writing.

```ts
await updateSession(session._id, { content: updatedText, pasteData: newSummary });
```

### `getSessionsByUser(userId)`

Returns all sessions for a user, newest first. Does not include full content or raw event arrays — suitable for listing a user's session history.

```ts
const sessions = await getSessionsByUser("user_123");
// [{ id, userId, wordCount, charCount, pasteRatio, totalKeystrokes, createdAt }, ...]
```

### `getSessionById(sessionId)`

Returns a single session including full content and all metadata.

```ts
const session = await getSessionById("abc123");
```

### `deleteSession(sessionId)`

Deletes a session. Returns `true` if deleted, `false` if not found.

## React Hook

```tsx
const { saveNow, isSaving, lastSaved, error } = useSessionStorage({
  userId: "user_123",
  getContent: () => editorRef.current?.value ?? "",
  getPasteData: () => buildPasteSummary(detector, content.length),
  autosaveInterval: 30000, // autosave every 30 seconds
});

// Show save status in the UI
<span>{isSaving ? "Saving..." : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : ""}</span>
<button onClick={saveNow}>Save Now</button>
```

## Express Routes

Mount in your main Express app:

```ts
import sessionRoutes from "./sessionRoutes";
app.use("/api/sessions", sessionRoutes);
```

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/sessions` | Save a new session |
| PATCH | `/api/sessions/:id` | Update an existing session |
| GET | `/api/sessions?userId=xxx` | Get all sessions for a user |
| GET | `/api/sessions/:id` | Get a single session with full content |
| DELETE | `/api/sessions/:id` | Delete a session |

## Environment Variables

Create a `.env` file in your project root:

```
MONGODB_URI=mongodb://localhost:27017/vi-notes
```

## Setup

```bash
npm install mongoose mongodb-memory-server @types/mongoose
npm test        # runs tests against in-memory MongoDB
npm run build   # compiles to dist/
```
