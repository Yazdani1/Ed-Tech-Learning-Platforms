'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { useHeroText } from './useHeroText';

import type { HeroPost } from '@/schemas/showcase.schema';
import type { FC } from 'react';

interface HeroPostThumbnailProps {
  post: HeroPost;
  position: number;
  onView: (post: HeroPost) => void;
}

const THUMB_WIDTH_DESKTOP = 360;

/** The wide banner thumbnail with its position, visibility and schedule chips; opens the details. */
export const HeroPostThumbnail: FC<HeroPostThumbnailProps> = ({ post, position, onView }) => {
  const { t } = useTranslation();
  const text = useHeroText();
  const scheduleChip = text.scheduleChip(post);
  const isPublic = post.visibility === 'Public';

  return (
    <ButtonBase
      onClick={() => {
        onView(post);
      }}
      aria-label={t('showcase.posts.viewDetails')}
      sx={{
        position: 'relative',
        width: { xs: '100%', md: THUMB_WIDTH_DESKTOP },
        flexShrink: 0,
        aspectRatio: '16 / 5',
        bgcolor: 'grey.100',
        cursor: 'zoom-in',
      }}
    >
      <Image
        src={post.imageUrl}
        alt={t('showcase.posts.imageAlt', { position })}
        fill
        sizes={`(min-width: 900px) ${THUMB_WIDTH_DESKTOP}px, 100vw`}
        style={{ objectFit: 'cover' }}
      />
      <Box
        sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}
      >
        <Chip
          label={t('showcase.posts.position', { position })}
          size="small"
          sx={{ fontWeight: 900, bgcolor: 'common.white' }}
        />
        <Chip
          label={text.visibility(post)}
          size="small"
          color={isPublic ? 'success' : 'default'}
          sx={{ fontWeight: 800, bgcolor: isPublic ? undefined : 'grey.200' }}
        />
        {scheduleChip && (
          <Chip label={scheduleChip} size="small" color="warning" sx={{ fontWeight: 800 }} />
        )}
      </Box>
    </ButtonBase>
  );
};
