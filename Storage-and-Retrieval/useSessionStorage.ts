/**
 * useSessionStorage.ts
 * Vi-Notes — Feature #5: Save Writing Session Data
 *
 * React hook that connects the editor to the session storage API.
 * Handles saving on demand and autosave with a configurable delay.
 *
 * Usage:
 *   const { saveNow, isSaving, lastSaved, currentSessionId } = useSessionStorage({
 *     userId,
 *     getContent: () => editorRef.current?.value ?? "",
 *     getPasteData: () => pasteDetector.getSummary(editorRef.current?.value.length ?? 0),
 *   });
 */

import { useState, useRef, useCallback, useEffect } from "react";

export interface SessionStorageOptions {
  /** The logged-in user's ID */
  userId: string;
  /** Function that returns the current editor content */
  getContent: () => string;
  /** Function that returns the current paste summary (from Feature #4) */
  getPasteData?: () => object;
  /** Function that returns the current keystroke summary (from Feature #3) */
  getKeystrokeData?: () => object;
  /** Autosave interval in ms — set to 0 to disable (default: 30000) */
  autosaveInterval?: number;
  /** API base URL (default: /api) */
  apiBase?: string;
}

export interface UseSessionStorageResult {
  /** Manually trigger a save */
  saveNow: () => Promise<void>;
  /** True while a save request is in flight */
  isSaving: boolean;
  /** Timestamp of the last successful save */
  lastSaved: Date | null;
  /** The MongoDB ID of the current session once saved */
  currentSessionId: string | null;
  /** Error message if last save failed */
  error: string | null;
}

export function useSessionStorage(
  options: SessionStorageOptions
): UseSessionStorageResult {
  const {
    userId,
    getContent,
    getPasteData,
    getKeystrokeData,
    autosaveInterval = 30000,
    apiBase = "/api",
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const saveNow = useCallback(async () => {
    const content = getContent();
    if (!content.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const body = {
        userId,
        content,
        pasteData: getPasteData?.() ?? {},
        keystrokeData: getKeystrokeData?.() ?? {},
      };

      let response: Response;

      if (sessionIdRef.current) {
        // Update existing session
        response = await fetch(`${apiBase}/sessions/${sessionIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // Create new session
        response = await fetch(`${apiBase}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const id = data.session?._id ?? data.session?.id;

      if (id) {
        sessionIdRef.current = id;
        setCurrentSessionId(id);
      }

      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [userId, getContent, getPasteData, getKeystrokeData, apiBase]);

  // Autosave
  useEffect(() => {
    if (!autosaveInterval) return;
    const timer = setInterval(saveNow, autosaveInterval);
    return () => clearInterval(timer);
  }, [saveNow, autosaveInterval]);

  return { saveNow, isSaving, lastSaved, currentSessionId, error };
}
