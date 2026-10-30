'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PreviewLectureItem } from './PreviewLectureItem';

import type { CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PreviewLectureListProps {
  lectures: readonly CourseLecture[];
  currentId: string | undefined;
  onSelect: (lecture: CourseLecture) => void;
}

const PANEL_SX = {
  width: { xs: '100%', md: 280 },
  bgcolor: '#1a1a1a',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: { md: '1px solid #2a2a2a' },
  borderTop: { xs: '1px solid #2a2a2a', md: 'none' },
} as const;

/** The other free previews of the course, beside the player (under it on phones). */
export const PreviewLectureList: FC<PreviewLectureListProps> = ({
  lectures,
  currentId,
  onSelect,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={PANEL_SX}>
      <Typography
        variant="caption"
        sx={{
          px: 2,
          py: 1.5,
          color: 'grey.400',
          fontWeight: 600,
          textTransform: 'uppercase',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        {t('browse.preview.list', { count: lectures.length })}
      </Typography>
      <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
        {lectures.map((lecture) => (
          <PreviewLectureItem
            key={lecture._id}
            lecture={lecture}
            active={lecture._id === currentId}
            onSelect={onSelect}
          />
        ))}
      </List>
    </Box>
  );
};
