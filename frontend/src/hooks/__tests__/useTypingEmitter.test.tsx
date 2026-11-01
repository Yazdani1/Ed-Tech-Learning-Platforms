import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TYPING_IDLE_MS, useTypingEmitter } from '../useTypingEmitter';

describe('useTypingEmitter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tells the others while typing and stops after a pause', () => {
    const emit = vi.fn();
    const { result } = renderHook(() => useTypingEmitter(emit));
    act(() => {
      result.current.typed('Hel');
    });
    expect(emit).toHaveBeenLastCalledWith(true);
    act(() => {
      vi.advanceTimersByTime(TYPING_IDLE_MS);
    });
    expect(emit).toHaveBeenLastCalledWith(false);
  });

  it('stops on send and on unmount, and a cleared box is not typing', () => {
    const emit = vi.fn();
    const { result, unmount } = renderHook(() => useTypingEmitter(emit));
    act(() => {
      result.current.typed('   ');
    });
    expect(emit).toHaveBeenLastCalledWith(false);
    act(() => {
      result.current.typed('Hi');
      result.current.stop();
    });
    expect(emit).toHaveBeenLastCalledWith(false);
    act(() => {
      result.current.typed('Again');
    });
    emit.mockClear();
    unmount();
    expect(emit).toHaveBeenCalledWith(false);
    // The idle timer was cleared: nothing more is sent
    emit.mockClear();
    vi.advanceTimersByTime(TYPING_IDLE_MS);
    expect(emit).not.toHaveBeenCalled();
  });
});
