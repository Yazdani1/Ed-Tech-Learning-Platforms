'use client';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useCommunityProfile } from '@/api/community.api';

import { ProfilePreviewContent } from './ProfilePreviewContent';

import type { FC } from 'react';

const PREVIEW_WIDTH = 340;

interface ProfilePreviewPopoverProps {
  anchorEl: HTMLElement | null;
  userId: string | undefined;
  onClose: () => void;
}

/** A member's card (name, role, counts, badges, points) opened from their name; loads when opened. */
export const ProfilePreviewPopover: FC<ProfilePreviewPopoverProps> = ({
  anchorEl,
  userId,
  onClose,
}) => {
  const { t } = useTranslation();
  const open = anchorEl !== null && Boolean(userId);
  const profile = useCommunityProfile(open ? userId : undefined);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      onClick={(event) => {
        event.stopPropagation();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <Box sx={{ width: PREVIEW_WIDTH, maxWidth: 'calc(100vw - 32px)' }}>
        {profile.isPending ? (
          <Box sx={{ p: 3 }} aria-busy="true" aria-label={t('community.profile.loading')}>
            <Skeleton variant="circular" width={96} height={96} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" />
          </Box>
        ) : profile.data ? (
          <ProfilePreviewContent profile={profile.data} onNavigate={onClose} />
        ) : (
          <Typography sx={{ p: 3, textAlign: 'center' }}>
            {t('community.profile.notFound')}
          </Typography>
        )}
      </Box>
    </Popover>
  );
};
