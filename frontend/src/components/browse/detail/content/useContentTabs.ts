'use client';

import { useState } from 'react';

import { CONTENT_VIEWS, type ContentView } from './ContentViewButtons';

const toggleId = (ids: readonly string[], id: string, open: boolean): string[] =>
  open ? [...ids, id] : ids.filter((item) => item !== id);

export interface ContentTabs {
  /** The list shown (the chosen one, or the first that has content) */
  view: ContentView;
  setView: (view: ContentView) => void;
  /** More than one list has content: show the switch buttons */
  showSwitch: boolean;
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
  const [chosen, setView] = useState<ContentView>('recorded');
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openWeeks, setOpenWeeks] = useState<string[]>([]);
  const view = available[chosen]
    ? chosen
    : (CONTENT_VIEWS.find((item) => available[item]) ?? 'recorded');
  const isRecorded = view === 'recorded';
  const allIds = isRecorded ? sectionIds : weekIds;
  const openIds = isRecorded ? openSections : openWeeks;
  const allOpen = allIds.length > 0 && openIds.length === allIds.length;

  return {
    view,
    setView,
    showSwitch: Object.values(available).filter(Boolean).length > 1,
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
