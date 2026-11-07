'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSetUserBlocked } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

interface BlockUserModalProps {
  /** (Mounted only while open.) */
  user: ManagedUser;
  onClose: () => void;
}

const REASON_MAX = 300;
const REASON_ROWS = 3;

/** Block (with an optional reason) or unblock a user; a blocked user is signed out and cannot sign in. */
export const BlockUserModal: FC<BlockUserModalProps> = ({ user, onClose }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const save = useSetUserBlocked();
  const blocking = !user.isBlocked;
  const b = (key: string, options?: Record<string, unknown>): string =>
    t(`people.users.block.${key}`, options);

  return (
    <AppModal
      open
      onClose={onClose}
      title={b(blocking ? 'blockTitle' : 'unblockTitle', { name: user.name })}
      saveLabel={b(blocking ? 'block' : 'unblock')}
      saveColor={blocking ? 'error' : 'success'}
      saving={save.isPending}
      onSave={() => {
        save.mutate(
          { userId: user._id, blocked: blocking, reason: blocking ? reason.trim() : undefined },
          {
            onSuccess: () => {
              toast.success(b(blocking ? 'blocked' : 'unblocked', { name: user.name }));
              onClose();
            },
          },
        );
      }}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <Typography>
          {b(blocking ? 'blockMessage' : 'unblockMessage', { name: user.name })}
        </Typography>
        {blocking && (
          <TextField
            label={b('reason')}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            multiline
            rows={REASON_ROWS}
            slotProps={{ htmlInput: { maxLength: REASON_MAX } }}
            helperText={`${String(reason.length)}/${String(REASON_MAX)}`}
          />
        )}
        {!blocking && user.blockReason && (
          <Alert severity="info">{b('currentReason', { reason: user.blockReason })}</Alert>
        )}
      </Stack>
    </AppModal>
  );
};
