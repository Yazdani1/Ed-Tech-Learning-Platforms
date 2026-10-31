'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatLectureDuration, youTubeId } from '@/components/browse/course-utils';
import { YouTubeEmbed } from '@/components/browse/detail/YouTubeEmbed';

import type { CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LecturePlayerProps {
  lecture: CourseLecture | null;
}

/** The 16:9 YouTube player (only addresses the server sent are embedded), then the lecture's title. */
export const LecturePlayer: FC<LecturePlayerProps> = ({ lecture }) => {
  const { t } = useTranslation();
  const videoId = youTubeId(lecture?.videoUrl);
  const duration = formatLectureDuration(lecture?.duration);
  return (
    <>
      <Box
        sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', bgcolor: 'common.black' }}
      >
        {videoId && lecture ? (
          <YouTubeEmbed key={lecture._id} videoId={videoId} title={lecture.title} />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2 }}>
            <Typography color="grey.500" align="center">
              {t(lecture ? 'learn.video.noVideo' : 'learn.video.select')}
            </Typography>
          </Box>
        )}
      </Box>
      {lecture && (
        <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: 1, borderColor: 'divider' }}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            {lecture.title}
          </Typography>
          {duration && (
            <Typography variant="caption" color="text.secondary">
              {t('learn.video.duration', { duration })}
            </Typography>
          )}
        </Box>
      )}
    </>
  );
};
