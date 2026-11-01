'use client';

import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { safeImage } from '../common/community-utils';

import { SidebarEmpty } from './SidebarEmpty';

import type { CommunityBadge } from '@/schemas/community.schema';
import type { FC } from 'react';

const badgeAvatarSx = { width: 34, height: 34, bgcolor: 'success.light' };

interface BadgeListProps {
  badges: CommunityBadge[];
}

/** Every active badge with the points needed to earn it. */
export const BadgeList: FC<BadgeListProps> = ({ badges }) => {
  const { t } = useTranslation();
  if (badges.length === 0) return <SidebarEmpty text={t('community.sidebar.noBadges')} />;
  return (
    <Stack spacing={1}>
      {badges.map((badge) => (
        <Stack key={badge._id} direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
          <Avatar src={safeImage(badge.imageUrl)} alt="" variant="rounded" sx={badgeAvatarSx}>
            <EmojiEventsOutlinedIcon fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
              {badge.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('community.author.points', { count: badge.requiredPoints })}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
};
