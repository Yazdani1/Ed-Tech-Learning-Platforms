'use client';

import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { REACTION_TYPES, type ReactionType } from '@/schemas/community.schema';

import { REACTION_ICONS } from './community-utils';

import type { FC } from 'react';

interface ReactionPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onPick: (type: ReactionType) => void;
}

/** The six reactions in a small bubble above the button (touch and keyboard friendly). */
export const ReactionPicker: FC<ReactionPickerProps> = ({ anchorEl, onClose, onPick }) => {
  const { t } = useTranslation();
  return (
    <Popover
      open={anchorEl !== null}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{ paper: { sx: { borderRadius: 5 } } }}
    >
      <Stack
        direction="row"
        role="group"
        aria-label={t('community.reactions.choose')}
        sx={{ p: 0.5, gap: 0.25 }}
      >
        {REACTION_TYPES.map((type) => (
          <Tooltip key={type} title={t(`community.reactions.${type}`)}>
            <IconButton
              aria-label={t(`community.reactions.${type}`)}
              onClick={() => {
                onPick(type);
              }}
              sx={{
                width: 44,
                height: 44,
                fontSize: 24,
                transition: 'transform 150ms ease',
                '&:hover': { transform: 'translateY(-4px) scale(1.2)', bgcolor: 'transparent' },
              }}
            >
              {REACTION_ICONS[type]}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
    </Popover>
  );
};
