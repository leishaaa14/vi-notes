/**
 * pasteDetector.ts
 * Vi-Notes — Feature #4: Detect Pasted Text
 *
 * Attaches to an HTMLTextAreaElement (or contenteditable) and records every
 * paste event: when it happened, how much text was pasted, and a short
 * preview (no full content stored — privacy-preserving by design).
 *
 * Usage:
 *   const detector = createPasteDetector(textareaEl, { onPaste: console.log });
 *   detector.destroy(); // remove listeners when done
 */

export interface PasteEvent {
  /** ISO timestamp of the paste */
  timestamp: string;
  /** Number of characters in the pasted text */
  pastedLength: number;
  /** First 100 chars for anomaly inspection — never stored in full */
  pastedPreview: string;
  /** Cursor position in the editor when paste occurred */
  cursorPosition: number;
  /** Running total of paste events in this session */
  sessionPasteCount: number;
  /** Running total of pasted characters in this session */
  sessionPastedChars: number;
}

export interface PasteDetectorOptions {
  /** Called synchronously on every paste event */
  onPaste?: (event: PasteEvent) => void;
  /** Max preview length stored per event (default: 100) */
  previewLength?: number;
}

export interface PasteDetector {
  /** All paste events captured so far */
  readonly events: ReadonlyArray<PasteEvent>;
  /** Remove event listeners — call when the component unmounts */
  destroy: () => void;
}

export function createPasteDetector(
  element: HTMLTextAreaElement | HTMLElement,
  options: PasteDetectorOptions = {}
): PasteDetector {
  const { onPaste, previewLength = 100 } = options;
  const events: PasteEvent[] = [];

  function handlePaste(e: ClipboardEvent): void {
    const raw = e.clipboardData?.getData("text") ?? "";

    const pasteEvent: PasteEvent = {
      timestamp: new Date().toISOString(),
      pastedLength: raw.length,
      // Truncate — we only need a statistical signal, not the full content
      pastedPreview: raw.slice(0, previewLength),
      cursorPosition:
        element instanceof HTMLTextAreaElement
          ? element.selectionStart ?? -1
          : -1,
      sessionPasteCount: events.length + 1,
      sessionPastedChars:
        events.reduce((sum, ev) => sum + ev.pastedLength, 0) + raw.length,
    };

    events.push(pasteEvent);
    onPaste?.(pasteEvent);
  }

  element.addEventListener("paste", handlePaste as EventListener);

  return {
    get events() {
      return events as ReadonlyArray<PasteEvent>;
    },
    destroy() {
      element.removeEventListener("paste", handlePaste as EventListener);
    },
  };
}

/**
 * Compute a summary suitable for attaching to a saved writing session.
 * This is what gets persisted to MongoDB alongside keystroke timing data.
 */
export interface PasteSummary {
  totalPasteEvents: number;
  totalPastedChars: number;
  pasteEvents: PasteEvent[];
  /** Ratio of pasted chars to total chars in the editor (0–1) */
  pasteRatio: number;
}

export function buildPasteSummary(
  detector: PasteDetector,
  totalEditorChars: number
): PasteSummary {
  const totalPastedChars = detector.events.reduce(
    (sum, ev) => sum + ev.pastedLength,
    0
  );

  return {
    totalPasteEvents: detector.events.length,
    totalPastedChars,
    pasteEvents: [...detector.events],
    pasteRatio:
      totalEditorChars > 0
        ? parseFloat((totalPastedChars / totalEditorChars).toFixed(4))
        : 0,
  };
}
