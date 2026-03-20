/**
 * pasteDetector.test.ts
 * Vi-Notes — Feature #4: Detect Pasted Text
 * Run with: npx jest pasteDetector.test.ts
 */
import { createPasteDetector, buildPasteSummary, } from "./pasteDetector";
// --- helpers ---
function makeTextarea() {
    return document.createElement("textarea");
}
function firePaste(el, text) {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    event.clipboardData = {
        getData: (_type) => text,
    };
    el.dispatchEvent(event);
}
// --- tests ---
describe("createPasteDetector", () => {
    it("records a paste event with correct length", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "Hello world");
        expect(detector.events).toHaveLength(1);
        expect(detector.events[0].pastedLength).toBe(11);
    });
    it("stores a preview truncated to previewLength", () => {
        const el = makeTextarea();
        const longText = "a".repeat(200);
        const detector = createPasteDetector(el, { previewLength: 50 });
        firePaste(el, longText);
        expect(detector.events[0].pastedPreview).toHaveLength(50);
    });
    it("does not store preview longer than default 100 chars", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "b".repeat(300));
        expect(detector.events[0].pastedPreview.length).toBeLessThanOrEqual(100);
    });
    it("increments sessionPasteCount on each event", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "first");
        firePaste(el, "second");
        expect(detector.events[0].sessionPasteCount).toBe(1);
        expect(detector.events[1].sessionPasteCount).toBe(2);
    });
    it("accumulates sessionPastedChars correctly", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "abc"); // 3
        firePaste(el, "de"); // 2 → total 5
        expect(detector.events[1].sessionPastedChars).toBe(5);
    });
    it("calls onPaste callback for each event", () => {
        const el = makeTextarea();
        const cb = jest.fn();
        createPasteDetector(el, { onPaste: cb });
        firePaste(el, "test");
        firePaste(el, "again");
        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb.mock.calls[0][0].pastedLength).toBe(4);
    });
    it("stops recording after destroy()", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "before");
        detector.destroy();
        firePaste(el, "after");
        expect(detector.events).toHaveLength(1);
    });
    it("stores an ISO timestamp", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "ts test");
        expect(new Date(detector.events[0].timestamp).toISOString()).toBe(detector.events[0].timestamp);
    });
});
describe("buildPasteSummary", () => {
    it("calculates pasteRatio correctly", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "a".repeat(50));
        const summary = buildPasteSummary(detector, 200);
        expect(summary.pasteRatio).toBe(0.25);
    });
    it("returns ratio 0 when totalEditorChars is 0", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        const summary = buildPasteSummary(detector, 0);
        expect(summary.pasteRatio).toBe(0);
    });
    it("includes all events in the summary", () => {
        const el = makeTextarea();
        const detector = createPasteDetector(el);
        firePaste(el, "x".repeat(10));
        firePaste(el, "y".repeat(20));
        const summary = buildPasteSummary(detector, 100);
        expect(summary.totalPasteEvents).toBe(2);
        expect(summary.totalPastedChars).toBe(30);
        expect(summary.pasteEvents).toHaveLength(2);
    });
});
