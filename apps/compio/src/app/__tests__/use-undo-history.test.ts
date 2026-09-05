import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUndoHistory } from "../hooks/use-undo-history";

const INITIAL_VALUE = 0;

describe("useUndoHistory", () => {
  it("starts at the initial value with nothing to undo or redo", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));

    expect(result.current.present).toBe(INITIAL_VALUE);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("setPresent updates the value without creating an undo step", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));

    act(() => result.current.setPresent(1));
    act(() => result.current.setPresent(2));

    expect(result.current.present).toBe(2);
    expect(result.current.canUndo).toBe(false);
  });

  it("commit snapshots the previous value, then applies the update", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));

    act(() => result.current.commit(1));

    expect(result.current.present).toBe(1);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.present).toBe(INITIAL_VALUE);
  });

  it("beginTransaction followed by live setPresent updates behaves as a single undo step", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));

    act(() => result.current.beginTransaction());
    act(() => result.current.setPresent(1));
    act(() => result.current.setPresent(2));
    act(() => result.current.setPresent(3));

    expect(result.current.present).toBe(3);

    act(() => result.current.undo());
    expect(result.current.present).toBe(INITIAL_VALUE);
    expect(result.current.canUndo).toBe(false);
  });

  it("redo restores what undo reverted, and a new commit discards stale future entries", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));

    act(() => result.current.commit(1));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.present).toBe(1);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.undo());
    act(() => result.current.commit(2));
    expect(result.current.present).toBe(2);
    expect(result.current.canRedo).toBe(false);
  });

  it("reset replaces the present value and clears both stacks", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));

    act(() => result.current.commit(1));
    act(() => result.current.commit(2));
    act(() => result.current.reset(100));

    expect(result.current.present).toBe(100);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("caps history depth instead of growing the undo stack unboundedly", () => {
    const { result } = renderHook(() => useUndoHistory(INITIAL_VALUE));
    const COMMIT_COUNT = 100;

    Array.from({ length: COMMIT_COUNT }, (_placeholder, index) => index + 1).forEach((value) => {
      act(() => result.current.commit(value));
    });

    let successfulUndoCount = 0;
    Array.from({ length: COMMIT_COUNT }).forEach(() => {
      const canUndoBefore = result.current.canUndo;
      act(() => result.current.undo());
      if (canUndoBefore) successfulUndoCount += 1;
    });

    expect(successfulUndoCount).toBeLessThan(COMMIT_COUNT);
  });
});
