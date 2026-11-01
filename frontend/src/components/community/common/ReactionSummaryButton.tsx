'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { useModal } from '@/hooks/useModal';

import { REACTION_ICONS, reactionSummary } from './community-utils';
import { ReactionsDialog } from './ReactionsDialog';

import type { Reaction } from '@/schemas/community.schema';
import type { FC } from 'react';

/** Reaction types shown in the summary. */
const SUMMARY_TYPES = 2;

interface ReactionSummaryButtonProps {
  reactions: Reaction[];
}

/** The two most used reaction emojis; opens the list of who reacted. Nothing when nobody reacted. */
export const ReactionSummaryButton: FC<ReactionSummaryButtonProps> = ({ reactions }) => {
  const { t } = useTranslation();
  const dialog = useModal();
  const summary = reactionSummary(reactions).slice(0, SUMMARY_TYPES);
  if (summary.length === 0) return null;
  return (
    <>
      <Button
        onClick={() => {
          dialog.openModal();
        }}
        aria-label={t('community.reactions.summary')}
        sx={{ minHeight: 44, minWidth: 44, fontSize: 18 }}
      >
        {summary.map((item) => (
          <Box component="span" key={item.type} aria-hidden>
            {REACTION_ICONS[item.type]}
          </Box>
        ))}
      </Button>
      <ReactionsDialog open={dialog.open} reactions={reactions} onClose={dialog.closeModal} />
    </>
  );
};
