'use client';

import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { formatCount, REACTION_ICONS } from './community-utils';

import type { ReactionType } from '@/schemas/community.schema';
import type { FC } from 'react';

interface MyReactionButtonProps {
  /** The reaction the signed-in user gave, if any */
  mine: ReactionType | undefined;
  total: number;
  disabled: boolean;
  signedOut: boolean;
  /** Like when there is no reaction yet; the same type again removes it */
  onReact: (type: ReactionType) => void;
}

/** 👍 + count: gives a Like, or removes the reaction you gave (its emoji is shown). */
export const MyReactionButton: FC<MyReactionButtonProps> = ({
  mine,
  total,
  disabled,
  signedOut,
  onReact,
}) => {
  const { t } = useTranslation();
  const label = mine
    ? t('community.reactions.remove', { reaction: t(`community.reactions.${mine}`), count: total })
    : t('community.reactions.like', { count: total });
  return (
    <Tooltip title={signedOut ? t('community.reactions.signIn') : ''}>
      <span>
        <Button
          disabled={disabled}
          onClick={() => {
            onReact(mine ?? 'Like');
          }}
          aria-label={label}
          aria-pressed={mine !== undefined}
          sx={{
            minHeight: 44,
            gap: 0.75,
            fontWeight: 800,
            color: mine ? 'primary.main' : 'text.secondary',
          }}
        >
          {mine ? (
            <Box component="span" aria-hidden sx={{ fontSize: 22, lineHeight: 1 }}>
              {REACTION_ICONS[mine]}
            </Box>
          ) : (
            <ThumbUpOutlinedIcon />
          )}
          {formatCount(total)}
        </Button>
      </span>
    </Tooltip>
  );
};
