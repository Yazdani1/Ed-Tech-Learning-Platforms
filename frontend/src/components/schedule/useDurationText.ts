'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { durationParts } from './schedule.utils';

/**
 * Short duration text: "1h 5m 9s" / "5m 9s" / "9s" (withSeconds), or "1h 5m" / "5m 9s" / "9s" (badges).
 */
export const useDurationText = (): ((seconds: number, withSeconds?: boolean) => string) => {
  const { t } = useTranslation();
  return useCallback(
    (seconds, withSeconds = true) => {
      const { h, m, s } = durationParts(seconds);
      if (h > 0)
        return t(withSeconds ? 'schedule.duration.hms' : 'schedule.duration.hm', { h, m, s });
      if (m > 0) return t('schedule.duration.ms', { m, s });
      return t('schedule.duration.s', { s });
    },
    [t],
  );
};
