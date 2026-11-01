'use client';

import AddIcon from '@mui/icons-material/Add';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { communityProfileHref, signInHref } from '../common/community-utils';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import type { FC } from 'react';

const buttonSx = { minHeight: 44 };

interface HubUserActionsProps {
  onNewDiscussion: () => void;
  onOpenSettings: () => void;
}

/** Community Settings (Super Admin, Admin), My Profile and New Discussion, or "Sign in to participate". */
export const HubUserActions: FC<HubUserActionsProps> = ({ onNewDiscussion, onOpenSettings }) => {
  const { t } = useTranslation();
  const { user, isAdmin } = useCommunityPermissions();

  if (!user) {
    return (
      <Button
        component={Link}
        href={signInHref('/community-hub')}
        variant="contained"
        sx={buttonSx}
      >
        {t('community.actions.signIn')}
      </Button>
    );
  }
  return (
    <>
      {isAdmin && (
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={onOpenSettings}
          sx={buttonSx}
        >
          {t('community.actions.settings')}
        </Button>
      )}
      <Button
        component={Link}
        href={communityProfileHref(user._id)}
        variant="outlined"
        startIcon={<PersonOutlinedIcon />}
        sx={buttonSx}
      >
        {t('community.actions.myProfile')}
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onNewDiscussion} sx={buttonSx}>
        {t('community.actions.newDiscussion')}
      </Button>
    </>
  );
};
