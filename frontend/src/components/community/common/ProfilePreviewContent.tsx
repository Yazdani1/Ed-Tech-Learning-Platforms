'use client';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { communityProfileHref, initial, safeImage } from './community-utils';
import { PreviewDetails } from './PreviewDetails';

import type { CommunityProfile } from '@/schemas/community.schema';
import type { FC } from 'react';

const avatarSx = { width: 96, height: 96, fontSize: 36 };

interface ProfilePreviewContentProps {
  profile: CommunityProfile;
  /** Called when the user follows "View Profile" (closes the popover) */
  onNavigate: () => void;
}

/** Body of the profile preview popover (a private profile shows only the avatar and a notice). */
export const ProfilePreviewContent: FC<ProfilePreviewContentProps> = ({ profile, onNavigate }) => {
  const { t } = useTranslation();
  const { user } = profile;

  return (
    <>
      <Stack spacing={1.5} sx={{ alignItems: 'center', p: 3, textAlign: 'center' }}>
        <Avatar src={safeImage(user.avatar)} alt="" sx={avatarSx}>
          {initial(user.name)}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {profile.isPrivate ? t('community.profile.private') : user.name}
        </Typography>
        {!profile.isPrivate && <Chip label={user.role} size="small" variant="outlined" />}
        <Button
          component={Link}
          href={communityProfileHref(user._id)}
          onClick={onNavigate}
          variant="outlined"
        >
          {t('community.profile.view')}
        </Button>
      </Stack>
      {!profile.isPrivate && (
        <>
          <Divider />
          <PreviewDetails profile={profile} />
        </>
      )}
    </>
  );
};
