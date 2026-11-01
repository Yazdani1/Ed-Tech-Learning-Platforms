'use client';

import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { earnedBadges, safeImage } from './community-utils';

import type { CommunityBadge } from '@/schemas/community.schema';
import type { FC } from 'react';

/** Badges shown next to a name (the rest are on the profile). */
const MAX_LINE_BADGES = 3;

interface EarnedBadgeChipsProps {
  points: number | null | undefined;
  badges: CommunityBadge[];
}

/** Up to three badges a member earned with their points, as small green chips. */
export const EarnedBadgeChips: FC<EarnedBadgeChipsProps> = ({ points, badges }) => {
  const { t } = useTranslation();
  return (
    <>
      {earnedBadges(points, badges)
        .slice(0, MAX_LINE_BADGES)
        .map((badge) => {
          const image = safeImage(badge.imageUrl);
          return (
            <Tooltip
              key={badge._id}
              title={t('community.author.badgeTooltip', {
                name: badge.name,
                points: badge.requiredPoints,
              })}
            >
              <Chip
                size="small"
                avatar={image ? <Avatar src={image} alt="" /> : undefined}
                label={badge.name}
                color="success"
                variant="outlined"
              />
            </Tooltip>
          );
        })}
    </>
  );
};
