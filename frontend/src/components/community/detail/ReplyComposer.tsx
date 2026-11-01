'use client';

import ReplyIcon from '@mui/icons-material/Reply';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { communityPostHref, signInHref } from '../common/community-utils';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { ReplyForm } from './ReplyForm';

import type { FC } from 'react';

interface ReplyComposerProps {
  postId: string;
}

/** "Reply" (opens the answer form) for signed-in users, "Sign in to reply" for visitors. */
export const ReplyComposer: FC<ReplyComposerProps> = ({ postId }) => {
  const { t } = useTranslation();
  const { user } = useCommunityPermissions();
  const [open, setOpen] = useState(false);

  const content = !user ? (
    <Button
      component={Link}
      href={signInHref(communityPostHref(postId))}
      variant="outlined"
      startIcon={<ReplyIcon />}
      sx={{ minHeight: 44 }}
    >
      {t('community.reply.signIn')}
    </Button>
  ) : open ? (
    <ReplyForm
      postId={postId}
      onDone={() => {
        setOpen(false);
      }}
    />
  ) : (
    <Button
      variant="contained"
      startIcon={<ReplyIcon />}
      onClick={() => {
        setOpen(true);
      }}
      sx={{ minHeight: 44 }}
    >
      {t('community.reply.reply')}
    </Button>
  );

  return (
    <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
      {content}
    </Box>
  );
};
