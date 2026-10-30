'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { DetailItem } from './common/DetailItem';
import { useHeroText } from './useHeroText';

import type { HeroPost } from '@/schemas/showcase.schema';
import type { FC } from 'react';

interface HeroPostDetailsModalProps {
  open: boolean;
  post: HeroPost | undefined;
  onClose: () => void;
}

const SCHEDULE_COLOR = '#b45309';

/** Large preview of a slider image with its visibility, size, position and schedule. */
export const HeroPostDetailsModal: FC<HeroPostDetailsModalProps> = ({ open, post, onClose }) => {
  const { t } = useTranslation();
  const text = useHeroText();
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('showcase.details.title')}
      maxWidth="md"
      cancelLabel={t('common.close')}
    >
      {post && (
        <Box>
          <Box
            sx={{
              position: 'relative',
              bgcolor: 'grey.100',
              borderRadius: 1,
              height: { xs: 220, md: 360 },
            }}
          >
            <Image
              src={post.imageUrl}
              alt={t('showcase.details.previewAlt')}
              fill
              sizes="(min-width: 900px) 900px, 100vw"
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Grid container spacing={1.5} sx={{ pt: 2 }}>
            <DetailItem label={t('showcase.details.visibility')}>
              {text.visibility(post)}
            </DetailItem>
            <DetailItem label={t('showcase.details.imageSize')}>
              {text.dimensions(post, 'showcase.details.unavailable')}
            </DetailItem>
            <DetailItem label={t('showcase.details.position')}>{post.order}</DetailItem>
            <DetailItem label={t('showcase.details.schedule')} wide>
              <Typography sx={{ color: SCHEDULE_COLOR, fontWeight: 900 }}>
                {text.schedule(post)}
              </Typography>
            </DetailItem>
          </Grid>
        </Box>
      )}
    </AppModal>
  );
};
