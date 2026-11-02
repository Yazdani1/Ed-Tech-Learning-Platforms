'use client';

import { useState } from 'react';

import { CONTENT_VIEWS, type ContentView } from './ContentViewButtons';

const toggleId = (ids: readonly string[], id: string, open: boolean): string[] =>
  open ? [...ids, id] : ids.filter((item) => item !== id);

export interface ContentTabs {
  /** The list shown (the chosen one, or the first that has content) */
  view: ContentView;
  setView: (view: ContentView) => void;
  /** The lists that have content, in button order */
  views: ContentView[];
  openSections: string[];
  openWeeks: string[];
  toggleSection: (id: string, open: boolean) => void;
  toggleWeek: (id: string, open: boolean) => void;
  /** Every section (or week) of the shown list is open */
  allOpen: boolean;
  toggleAll: () => void;
}

/** Which content list is shown and which of its sections / weeks are open. */
export const useContentTabs = (
  available: Record<ContentView, boolean>,
  sectionIds: readonly string[],
  weekIds: readonly string[],
): ContentTabs => {
  const [chosen, setView] = useState<ContentView | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openWeeks, setOpenWeeks] = useState<string[]>([]);
  const views = CONTENT_VIEWS.filter((item) => available[item]);
  const view = chosen && available[chosen] ? chosen : (views[0] ?? 'live');
  const isRecorded = view === 'recorded';
  const allIds = isRecorded ? sectionIds : weekIds;
  const openIds = isRecorded ? openSections : openWeeks;
  const allOpen = allIds.length > 0 && openIds.length === allIds.length;

  return {
    view,
    setView,
    views,
    openSections,
    openWeeks,
    toggleSection: (id, open) => {
      setOpenSections((ids) => toggleId(ids, id, open));
    },
    toggleWeek: (id, open) => {
      setOpenWeeks((ids) => toggleId(ids, id, open));
    },
    allOpen,
    toggleAll: () => {
      (isRecorded ? setOpenSections : setOpenWeeks)(allOpen ? [] : [...allIds]);
    },
  };
};
