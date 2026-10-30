'use client';

import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { describeSchedule, isScheduled } from './hero-schedule';

import type { HeroPost } from '@/schemas/showcase.schema';

export interface HeroText {
  /** "Changes to Public Oct 29, 2026, 3:45 PM", "Publishes ...", or "Publishes immediately when public" */
  schedule: (post: HeroPost) => string;
  /** The orange chip on the image, or null when nothing is scheduled */
  scheduleChip: (post: HeroPost) => string | null;
  /** "2048 x 460px", or the fallback text */
  dimensions: (post: HeroPost, fallbackKey: string) => string;
  visibility: (post: HeroPost) => string;
}

/** Translated texts for a hero post (dates in the viewer's own time zone). */
export const useHeroText = (): HeroText => {
  const { t, i18n } = useTranslation();
  const visibilityLabel = (value: HeroPost['visibility']): string =>
    t(`showcase.visibility.${value}`);

  return {
    schedule: (post) => {
      const schedule = describeSchedule(post);
      if (schedule.kind === 'immediate') return t('showcase.posts.publishesNow');
      const date = formatDateTime(schedule.date, i18n.language);
      return schedule.kind === 'changes'
        ? t('showcase.posts.changesAt', { visibility: visibilityLabel(schedule.visibility), date })
        : t('showcase.posts.publishesAt', { date });
    },
    scheduleChip: (post) => {
      if (!isScheduled(post)) return null;
      return post.scheduledVisibility
        ? t('showcase.posts.scheduledTo', { visibility: visibilityLabel(post.scheduledVisibility) })
        : t('showcase.posts.scheduled');
    },
    dimensions: (post, fallbackKey) =>
      post.imageWidth && post.imageHeight
        ? t('showcase.posts.dimensions', { width: post.imageWidth, height: post.imageHeight })
        : t(fallbackKey),
    visibility: (post) => visibilityLabel(post.visibility),
  };
};
