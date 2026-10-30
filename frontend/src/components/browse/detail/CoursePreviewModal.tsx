'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { youTubeId } from '../course-utils';

import { PreviewLectureList } from './PreviewLectureList';
import { YouTubeEmbed } from './YouTubeEmbed';

import type { CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CoursePreviewModalProps {
  open: boolean;
  lecture: CourseLecture | undefined;
  lectures: readonly CourseLecture[];
  courseTitle: string;
  onSelect: (lecture: CourseLecture) => void;
  onClose: () => void;
}

const BODY_SX = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  m: { xs: -2, sm: -3 },
  bgcolor: '#0f0f0f',
} as const;
const NO_VIDEO_SX = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'grey.500',
} as const;

/** Plays a free preview lecture (YouTube) with the list of every other free preview. */
export const CoursePreviewModal: FC<CoursePreviewModalProps> = ({
  open,
  lecture,
  lectures,
  courseTitle,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();
  const videoId = youTubeId(lecture?.videoUrl);
  const title = (
    <Box component="span" sx={{ display: 'block', minWidth: 0 }}>
      <Typography
        component="span"
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block' }}
      >
        {t('browse.preview.label', { course: courseTitle })}
      </Typography>
      <Typography component="span" sx={{ fontWeight: 700, display: 'block' }}>
        {lecture?.title}
      </Typography>
    </Box>
  );
  return (
    <AppModal open={open} onClose={onClose} maxWidth="md" hideActions title={title}>
      <Box sx={BODY_SX}>
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'common.black', aspectRatio: '16 / 9' }}>
          {lecture && videoId ? (
            <YouTubeEmbed key={lecture._id} videoId={videoId} title={lecture.title} />
          ) : (
            <Typography sx={NO_VIDEO_SX}>{t('browse.preview.noVideo')}</Typography>
          )}
        </Box>
        {lectures.length > 1 && (
          <PreviewLectureList lectures={lectures} currentId={lecture?._id} onSelect={onSelect} />
        )}
      </Box>
    </AppModal>
  );
};
