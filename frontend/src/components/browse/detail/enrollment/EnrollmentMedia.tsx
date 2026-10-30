'use client';

import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';
import { YouTubeEmbed } from '../YouTubeEmbed';

import type { FC } from 'react';

interface EnrollmentMediaProps {
  title: string;
  coverImage: string | null | undefined;
  /** YouTube id of the introduction / first free preview, or null */
  introVideoId: string | null;
}

const MEDIA_HEIGHT = 200;
const SIZES = '(max-width: 900px) 100vw, 400px';

/** Top of the enrolment card: the cover, which plays the introduction video when there is one. */
export const EnrollmentMedia: FC<EnrollmentMediaProps> = ({ title, coverImage, introVideoId }) => {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  if (introVideoId && playing) {
    return (
      <Box sx={{ position: 'relative', height: MEDIA_HEIGHT, bgcolor: 'common.black' }}>
        <YouTubeEmbed videoId={introVideoId} title={t('browse.enroll.introTitle')} />
      </Box>
    );
  }
  if (!introVideoId) {
    return (
      <CourseCover src={coverImage} alt={title} height={MEDIA_HEIGHT} sizes={SIZES} priority />
    );
  }
  return (
    <ButtonBase
      onClick={() => {
        setPlaying(true);
      }}
      aria-label={t('browse.enroll.previewCourse')}
      sx={{ position: 'relative', display: 'block', width: '100%', height: MEDIA_HEIGHT }}
    >
      <CourseCover src={coverImage} alt="" height={MEDIA_HEIGHT} sizes={SIZES} priority />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          color: 'common.white',
        }}
      >
        <PlayCircleOutlinedIcon
          sx={{ fontSize: 56, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
        />
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          {t('browse.enroll.previewCourse')}
        </Typography>
      </Box>
    </ButtonBase>
  );
};
