'use client';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';
import { MONO_FONT } from '@/theme/fonts';

import { YouTubeEmbed } from '../YouTubeEmbed';

import type { FC } from 'react';

interface EnrollmentMediaProps {
  title: string;
  coverImage: string | null | undefined;
  /** YouTube id of the introduction / first free preview, or null */
  introVideoId: string | null;
}

const MEDIA_HEIGHT = 232;
const SIZES = '(max-width: 900px) 100vw, 400px';
const PLAY_SX = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 66,
  height: 66,
  borderRadius: '50%',
  bgcolor: '#2563eb',
  color: 'common.white',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 8px 24px rgba(37,99,235,0.5)',
} as const;
const CAPTION_SX = {
  position: 'absolute',
  left: 12,
  bottom: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1,
  py: 0.5,
  borderRadius: '6px',
  bgcolor: 'rgba(2,6,23,0.8)',
  color: 'common.white',
  fontFamily: MONO_FONT,
  fontSize: '0.75rem',
  fontWeight: 700,
} as const;

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
      <Box sx={PLAY_SX} aria-hidden>
        <PlayArrowIcon sx={{ fontSize: 36 }} />
      </Box>
      <Box sx={CAPTION_SX}>
        <VideocamOutlinedIcon sx={{ fontSize: 16, color: '#34d399' }} aria-hidden />
        {t('browse.enroll.coursePreview')}
      </Box>
    </ButtonBase>
  );
};
