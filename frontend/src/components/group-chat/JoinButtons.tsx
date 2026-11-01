'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import type { ChannelType } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface JoinButtonsProps {
  type: ChannelType;
  hasPendingRequest: boolean;
  busy: boolean;
  onJoin: () => void;
  onCancelRequest: () => void;
}

const pillSx = {
  minHeight: 44,
  fontWeight: 900,
  textTransform: 'none',
  borderRadius: 5,
  px: 4,
} as const;

/** Join (public), Request to join (private) or "Join request sent" + Cancel request. */
export const JoinButtons: FC<JoinButtonsProps> = ({
  type,
  hasPendingRequest,
  busy,
  onJoin,
  onCancelRequest,
}) => {
  const { t } = useTranslation();
  const joinLabel =
    type === 'Private' ? t('groupChat.join.requestPrivate') : t('groupChat.join.joinPublic');
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'center' }}>
      <Button
        variant="contained"
        size="large"
        disabled={hasPendingRequest || busy}
        onClick={onJoin}
        sx={pillSx}
      >
        {hasPendingRequest ? t('groupChat.join.requestSent') : joinLabel}
      </Button>
      {hasPendingRequest && (
        <Button
          variant="outlined"
          color="error"
          size="large"
          disabled={busy}
          onClick={onCancelRequest}
          sx={pillSx}
        >
          {t('groupChat.join.cancelRequest')}
        </Button>
      )}
    </Stack>
  );
};
