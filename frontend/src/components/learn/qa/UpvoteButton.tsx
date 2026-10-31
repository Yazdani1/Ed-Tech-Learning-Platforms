'use client';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface UpvoteButtonProps {
  upvotes: string[];
  userId: string;
  onClick: () => void;
}

/** Thumbs-up toggle with the vote count (filled when the user has voted). */
export const UpvoteButton: FC<UpvoteButtonProps> = ({ upvotes, userId, onClick }) => {
  const { t } = useTranslation();
  const voted = upvotes.includes(userId);
  return (
    <Button
      size="small"
      color={voted ? 'primary' : 'inherit'}
      startIcon={
        voted ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />
      }
      aria-pressed={voted}
      aria-label={t(voted ? 'learn.qa.removeUpvote' : 'learn.qa.upvote', { count: upvotes.length })}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      sx={{ minHeight: 44, minWidth: 56, fontWeight: 700 }}
    >
      {upvotes.length}
    </Button>
  );
};
