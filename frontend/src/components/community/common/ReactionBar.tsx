'use client';

import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatCount, reactionUserId } from './community-utils';
import { MyReactionButton } from './MyReactionButton';
import { ReactionPicker } from './ReactionPicker';
import { ReactionSummaryButton } from './ReactionSummaryButton';

import type { Reaction, ReactionType } from '@/schemas/community.schema';
import type { FC } from 'react';

const rowSx = { alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' };

interface ReactionBarProps {
  reactions: Reaction[];
  /** Signed-out visitors see the counts but cannot react */
  disabled: boolean;
  currentUserId: string | undefined;
  onReact: (type: ReactionType) => void;
  busy?: boolean;
  /** Answer count button (discussions only) */
  answerCount?: number;
  onAnswerClick?: () => void;
}

/** Your reaction, the picker with six reactions, the answer count and who reacted (dialog). */
export const ReactionBar: FC<ReactionBarProps> = ({
  reactions,
  disabled,
  currentUserId,
  onReact,
  busy = false,
  answerCount,
  onAnswerClick,
}) => {
  const { t } = useTranslation();
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const mine = reactions.find((reaction) => reactionUserId(reaction) === currentUserId)?.type;

  return (
    <Stack direction="row" sx={rowSx}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <MyReactionButton
          mine={mine}
          total={reactions.length}
          disabled={disabled || busy}
          signedOut={disabled}
          onReact={onReact}
        />
        {!disabled && (
          <IconButton
            aria-label={t('community.reactions.choose')}
            aria-haspopup="true"
            disabled={busy}
            onClick={(event) => {
              setPickerAnchor(event.currentTarget);
            }}
            sx={{ width: 44, height: 44 }}
          >
            <AddReactionOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        {answerCount !== undefined && (
          <Button
            onClick={onAnswerClick}
            sx={{ minHeight: 44, color: 'text.secondary', fontWeight: 800 }}
          >
            {t('community.post.answers', { value: formatCount(answerCount) })}
          </Button>
        )}
      </Stack>
      <ReactionSummaryButton reactions={reactions} />
      <ReactionPicker
        anchorEl={pickerAnchor}
        onClose={() => {
          setPickerAnchor(null);
        }}
        onPick={(type) => {
          setPickerAnchor(null);
          onReact(type);
        }}
      />
    </Stack>
  );
};
