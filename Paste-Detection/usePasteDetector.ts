/**
 * usePasteDetector.ts
 * React hook that wraps createPasteDetector for use in the Vi-Notes editor.
 *
 * Usage:
 *   const { pasteEvents, summary, ref } = usePasteDetector();
 *   <textarea ref={ref} />
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createPasteDetector,
  buildPasteSummary,
  PasteEvent,
  PasteSummary,
  PasteDetector,
} from "./pasteDetector";

interface UsePasteDetectorResult {
  /** Ref to attach to the <textarea> element */
  ref: React.RefObject<HTMLTextAreaElement | null>;
  /** Live list of paste events captured this session */
  pasteEvents: PasteEvent[];
  /** Get a summary snapshot — pass current char count for pasteRatio */
  getSummary: (totalEditorChars: number) => PasteSummary;
}

export function usePasteDetector(): UsePasteDetectorResult {
  const ref = useRef<HTMLTextAreaElement>(null);
  const detectorRef = useRef<PasteDetector | null>(null);
  const [pasteEvents, setPasteEvents] = useState<PasteEvent[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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

  const getSummary = useCallback(
    (totalEditorChars: number): PasteSummary => {
      if (!detectorRef.current) {
        return {
          totalPasteEvents: 0,
          totalPastedChars: 0,
          pasteEvents: [],
          pasteRatio: 0,
        };
      }
      return buildPasteSummary(detectorRef.current, totalEditorChars);
    },
    []
  );

  return { ref, pasteEvents, getSummary };
}
