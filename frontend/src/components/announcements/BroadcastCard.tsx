'use client';

import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PostedByLine } from '@/components/common/PostedByLine';
import { useAuth } from '@/hooks/useAuth';
import { htmlToPlainText } from '@/utils/html-text';

import type { Broadcast } from '@/schemas/announcement-broadcast.schema';
import type { FC } from 'react';

interface BroadcastCardProps {
  item: Broadcast;
  onOpen: (item: Broadcast) => void;
}

const PREVIEW_LINES = 2;
const ICON_SX = {
  width: 44,
  height: 44,
  borderRadius: '12px',
  display: 'grid',
  placeItems: 'center',
  bgcolor: '#eef2ff',
  color: '#4338ca',
  flexShrink: 0,
} as const;
const PREVIEW_SX = {
  mt: 0.5,
  display: '-webkit-box',
  WebkitLineClamp: PREVIEW_LINES,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;

/** One sent announcement: title, a short preview, who posted it and when, its course count and "seen by". */
export const BroadcastCard: FC<BroadcastCardProps> = ({ item, onOpen }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardActionArea
        onClick={() => {
          onOpen(item);
        }}
        aria-label={t('announcements.openDetails', { title: item.title })}
        sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', gap: 2, alignItems: 'flex-start' }}
      >
        <Box aria-hidden sx={ICON_SX}>
          <CampaignOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h3" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={PREVIEW_SX}>
            {htmlToPlainText(item.description)}
          </Typography>
          <Box sx={{ mt: 1.5 }}>
            <PostedByLine
              postedBy={item.postedBy}
              createdAt={item.createdAt}
              userId={user?._id ?? ''}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
            <Chip
              size="small"
              icon={<SchoolOutlinedIcon />}
              label={t('announcements.courseCount', { count: item.courseCount })}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<VisibilityOutlinedIcon />}
              label={t('announcements.seenBy', { count: item.seenCount })}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};
