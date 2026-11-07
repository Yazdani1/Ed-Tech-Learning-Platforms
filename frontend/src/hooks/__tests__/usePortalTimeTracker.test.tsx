import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePortalTimeTracker } from '../usePortalTimeTracker';

const report = vi.fn<(seconds: number) => Promise<void>>(() => Promise.resolve());

vi.mock('@/api/auth.api', () => ({
  reportPortalActivity: (seconds: number) => report(seconds),
}));

const MINUTE = 60_000;

const setVisibility = (state: DocumentVisibilityState): void => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

describe('usePortalTimeTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    report.mockClear();
    setVisibility('visible');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports a minute while the tab is visible and in use', () => {
    renderHook(() => {
      usePortalTimeTracker(true);
    });
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(MINUTE);
    });
    expect(report).toHaveBeenCalledWith(60);
  });

  it('reports nothing for a hidden tab', () => {
    setVisibility('hidden');
    renderHook(() => {
      usePortalTimeTracker(true);
    });
    act(() => {
      vi.advanceTimersByTime(MINUTE);
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('stops counting after 10 idle minutes', () => {
    renderHook(() => {
      usePortalTimeTracker(true);
    });
    act(() => {
      vi.advanceTimersByTime(11 * MINUTE);
    });
    report.mockClear();
    act(() => {
      vi.advanceTimersByTime(MINUTE);
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('does nothing when not enabled (not a student)', () => {
    renderHook(() => {
      usePortalTimeTracker(false);
    });
    act(() => {
      vi.advanceTimersByTime(2 * MINUTE);
    });
    expect(report).not.toHaveBeenCalled();
  });
});
