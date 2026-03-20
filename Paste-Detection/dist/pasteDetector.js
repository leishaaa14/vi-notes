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
export function createPasteDetector(element, options = {}) {
    const { onPaste, previewLength = 100 } = options;
    const events = [];
    function handlePaste(e) {
        const raw = e.clipboardData?.getData("text") ?? "";
        const pasteEvent = {
            timestamp: new Date().toISOString(),
            pastedLength: raw.length,
            // Truncate — we only need a statistical signal, not the full content
            pastedPreview: raw.slice(0, previewLength),
            cursorPosition: element instanceof HTMLTextAreaElement
                ? element.selectionStart ?? -1
                : -1,
            sessionPasteCount: events.length + 1,
            sessionPastedChars: events.reduce((sum, ev) => sum + ev.pastedLength, 0) + raw.length,
        };
        events.push(pasteEvent);
        onPaste?.(pasteEvent);
    }
    element.addEventListener("paste", handlePaste);
    return {
        get events() {
            return events;
        },
        destroy() {
            element.removeEventListener("paste", handlePaste);
        },
    };
}
export function buildPasteSummary(detector, totalEditorChars) {
    const totalPastedChars = detector.events.reduce((sum, ev) => sum + ev.pastedLength, 0);
    return {
        totalPasteEvents: detector.events.length,
        totalPastedChars,
        pasteEvents: [...detector.events],
        pasteRatio: totalEditorChars > 0
            ? parseFloat((totalPastedChars / totalEditorChars).toFixed(4))
            : 0,
    };
}
