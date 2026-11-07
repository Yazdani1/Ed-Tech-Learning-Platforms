'use client';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface BroadcastBadgesProps {
  seenCount: number;
  /** Edited after it was sent */
  edited: boolean;
}

/** "Seen by N students" and, when it was changed after sending, "Edited". */
export const BroadcastBadges: FC<BroadcastBadgesProps> = ({ seenCount, edited }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', my: 2 }}>
      <Chip
        icon={<VisibilityOutlinedIcon />}
        label={t('announcements.seenBy', { count: seenCount })}
        color="primary"
        variant="outlined"
      />
      {edited && (
        <Chip size="small" label={t('announcements.edit.editedChip')} variant="outlined" />
      )}
    </Box>
  );
};
