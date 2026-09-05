import { useCallback, useState } from "react";

const MAX_HISTORY_DEPTH = 50;

interface HistoryState<TPresent> {
  past: TPresent[];
  present: TPresent;
  future: TPresent[];
}

export interface UndoHistoryState<TPresent> {
  present: TPresent;
  canUndo: boolean;
  canRedo: boolean;
  /** Live update — does not create an undo step. Use for continuous drag/stroke updates. */
  setPresent: (updater: TPresent | ((prev: TPresent) => TPresent)) => void;
  /** Snapshots the current present onto the undo stack, without changing it — call once at the start of a drag/stroke. */
  beginTransaction: () => void;
  /** Snapshots the current present, then applies the update — for single-shot, already-atomic actions. */
  commit: (updater: TPresent | ((prev: TPresent) => TPresent)) => void;
  /** Replaces present and clears both stacks — for loading a different document. */
  reset: (next: TPresent) => void;
  undo: () => void;
  redo: () => void;
}

const resolveUpdater = <TPresent>(
  updater: TPresent | ((prev: TPresent) => TPresent),
  prev: TPresent,
): TPresent =>
  typeof updater === "function" ? (updater as (prev: TPresent) => TPresent)(prev) : updater;

export const useUndoHistory = <TPresent>(
  initialPresent: TPresent | (() => TPresent),
): UndoHistoryState<TPresent> => {
  const [history, setHistory] = useState<HistoryState<TPresent>>(() => ({
    past: [],
    present:
      typeof initialPresent === "function" ? (initialPresent as () => TPresent)() : initialPresent,
    future: [],
  }));

  const setPresent = useCallback((updater: TPresent | ((prev: TPresent) => TPresent)) => {
    setHistory((prev) => ({ ...prev, present: resolveUpdater(updater, prev.present) }));
  }, []);

  const beginTransaction = useCallback(() => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present].slice(-MAX_HISTORY_DEPTH),
      present: prev.present,
      future: [],
    }));
  }, []);

  const commit = useCallback((updater: TPresent | ((prev: TPresent) => TPresent)) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present].slice(-MAX_HISTORY_DEPTH),
      present: resolveUpdater(updater, prev.present),
      future: [],
    }));
  }, []);

  const reset = useCallback((next: TPresent) => {
    setHistory({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      const previousEntry = prev.past.at(-1);
      if (previousEntry === undefined) return prev;

      return {
        past: prev.past.slice(0, -1),
        present: previousEntry,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      const nextEntry = prev.future[0];
      if (nextEntry === undefined) return prev;

      return {
        past: [...prev.past, prev.present],
        present: nextEntry,
        future: prev.future.slice(1),
      };
    });
  }, []);

  return {
    present: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setPresent,
    beginTransaction,
    commit,
    reset,
    undo,
    redo,
  };
};
