'use client';

import { useSiteSettings } from '@/api/site-settings.api';

import type { PublicLink } from './public-links';

/** The links whose page is switched on (Site Pages screen); all of them until the settings arrive. */
export const useVisibleLinks = (links: readonly PublicLink[]): readonly PublicLink[] => {
  const hidden = useSiteSettings().data?.hiddenPages;
  return hidden ? links.filter((link) => !hidden.includes(link.pageKey)) : links;
};
