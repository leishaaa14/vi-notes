/**
 * usePasteDetector.ts
 * React hook that wraps createPasteDetector for use in the Vi-Notes editor.
 *
 * Usage:
 *   const { pasteEvents, summary, ref } = usePasteDetector();
 *   <textarea ref={ref} />
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { createPasteDetector, buildPasteSummary, } from "./pasteDetector";
export function usePasteDetector() {
    const ref = useRef(null);
    const detectorRef = useRef(null);
    const [pasteEvents, setPasteEvents] = useState([]);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const detector = createPasteDetector(el, {
            onPaste: (event) => {
                setPasteEvents((prev) => [...prev, event]);
            },
        });
        detectorRef.current = detector;
        return () => {
            detector.destroy();
            detectorRef.current = null;
        };
    }, []);
    const getSummary = useCallback((totalEditorChars) => {
        if (!detectorRef.current) {
            return {
                totalPasteEvents: 0,
                totalPastedChars: 0,
                pasteEvents: [],
                pasteRatio: 0,
            };
        }
        return buildPasteSummary(detectorRef.current, totalEditorChars);
    }, []);
    return { ref, pasteEvents, getSummary };
}
