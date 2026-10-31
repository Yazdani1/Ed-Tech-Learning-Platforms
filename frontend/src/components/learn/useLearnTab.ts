'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { DEFAULT_TAB, isLearnTab, type LearnTab } from './learn-tabs';

export interface LearnTabState {
  tab: LearnTab;
  /** The Q&A question open in the Q&A tab (?questionId=, also used by notification links) */
  questionId: string | null;
  setTab: (tab: LearnTab) => void;
  openQuestion: (questionId: string | null) => void;
}

/** The open section of the player lives in the URL, so reloads and shared links keep it. */
export const useLearnTab = (): LearnTabState => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawTab = searchParams.get('tab');
  const questionId = searchParams.get('questionId');
  const tab: LearnTab = isLearnTab(rawTab) ? rawTab : questionId ? 'qa' : DEFAULT_TAB;

  const go = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setTab = useCallback(
    (next: LearnTab) => {
      go({ tab: next });
    },
    [go],
  );
  const openQuestion = useCallback(
    (id: string | null) => {
      go({ tab: 'qa', questionId: id });
    },
    [go],
  );

  return { tab, questionId, setTab, openQuestion };
};
