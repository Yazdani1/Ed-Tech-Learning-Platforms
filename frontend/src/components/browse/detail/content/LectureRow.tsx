'use client';

import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatLectureDuration, youTubeId } from '../../course-utils';

import type { CourseLecture } from '@/schemas/browse.schema';
import type { FC, ReactNode } from 'react';

interface LectureRowProps {
  lecture: CourseLecture;
  first: boolean;
  onPreview: (lecture: CourseLecture) => void;
}

/** One lecture of a section; a free preview with a video is a button that opens the preview player. */
export const LectureRow: FC<LectureRowProps> = ({ lecture, first, onPreview }) => {
  const { t } = useTranslation();
  const canPreview = lecture.isPreview && youTubeId(lecture.videoUrl) !== null;
  const duration = formatLectureDuration(lecture.duration);
  const rowSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    width: '100%',
    minHeight: 48,
    px: { xs: 2, sm: 2.5 },
    py: 1.25,
    textAlign: 'left',
    borderTop: first ? 'none' : '1px solid',
    borderColor: 'divider',
  } as const;
  const content: ReactNode = (
    <>
      <PlayCircleOutlinedIcon
        fontSize="small"
        sx={{ color: canPreview ? 'info.main' : 'action.active' }}
        aria-hidden
      />
      <Typography
        variant="body2"
        sx={{ flex: 1, minWidth: 0, color: canPreview ? 'info.main' : 'inherit' }}
      >
        {lecture.title}
      </Typography>
      {duration && (
        <Typography variant="caption" color="text.secondary">
          {duration}
        </Typography>
      )}
      {lecture.isPreview && (
        <Chip
          label={t('browse.content.freePreview')}
          size="small"
          color="info"
          variant="outlined"
        />
      )}
    </>
  );

  return canPreview ? (
    <ButtonBase
      component="li"
      onClick={() => {
        onPreview(lecture);
      }}
      sx={{ ...rowSx, '&:hover': { bgcolor: 'action.hover' } }}
    >
      {content}
    </ButtonBase>
  ) : (
    <Box component="li" sx={rowSx}>
      {content}
    </Box>
  );
};
