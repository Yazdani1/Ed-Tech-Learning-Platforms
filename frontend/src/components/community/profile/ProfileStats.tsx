'use client';

import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { UserStats } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ProfileStatsProps {
  stats: UserStats;
}

/** Four counters: discussions asked, answers/replies, reactions received and given. */
export const ProfileStats: FC<ProfileStatsProps> = ({ stats }) => {
  const { t, i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language);
  const items = [
    { key: 'discussionsAsked', Icon: ForumOutlinedIcon },
    { key: 'answersGiven', Icon: ChatBubbleOutlinedIcon },
    { key: 'reactionsReceived', Icon: ThumbUpOutlinedIcon },
    { key: 'reactionsGiven', Icon: ThumbUpOutlinedIcon },
  ] as const;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {items.map(({ key, Icon }) => (
        <Paper key={key} elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
            <Icon sx={{ color: 'primary.main' }} aria-hidden />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
              {t(`community.profile.stats.${key}`)}
            </Typography>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            {format.format(stats[key])}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};
