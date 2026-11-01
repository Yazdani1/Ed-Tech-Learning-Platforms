'use client';

import ReplyIcon from '@mui/icons-material/Reply';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ThreadButtonsProps {
  count: number;
  expanded: boolean;
  canReply: boolean;
  onToggle: () => void;
  onReply: () => void;
}

/** "Replies (n)" (show/hide the nested replies) and "Reply" under an answer. */
export const ThreadButtons: FC<ThreadButtonsProps> = ({
  count,
  expanded,
  canReply,
  onToggle,
  onReply,
}) => {
  const { t } = useTranslation();
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
      {count > 0 && (
        <Button aria-expanded={expanded} onClick={onToggle} sx={{ minHeight: 44, fontWeight: 800 }}>
          {t('community.reply.replies', { count })}
        </Button>
      )}
      {canReply && (
        <Button startIcon={<ReplyIcon />} onClick={onReply} sx={{ minHeight: 44 }}>
          {t('community.reply.reply')}
        </Button>
      )}
    </Stack>
  );
};
