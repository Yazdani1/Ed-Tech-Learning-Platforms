'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { BroadcastFields } from './BroadcastFields';
import { useBroadcastEditForm } from './useBroadcastEditForm';

import type { BroadcastDetails } from '@/schemas/announcement-broadcast.schema';
import type { FC } from 'react';

interface BroadcastEditModalProps {
  /** (Mounted only while open.) */
  item: BroadcastDetails;
  onClose: () => void;
}

/** Edit the title, text and picture of a sent announcement (every course gets the change; the old text is kept). */
export const BroadcastEditModal: FC<BroadcastEditModalProps> = ({ item, onClose }) => {
  const { t } = useTranslation();
  const state = useBroadcastEditForm(item, onClose);
  return (
    <AppModal
      open
      onClose={onClose}
      title={t('announcements.edit.title')}
      onSave={state.submit}
      saveLabel={t('common.save')}
      saving={state.saving}
      maxWidth="md"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {state.error && <Alert severity="error">{state.error.message}</Alert>}
        <Alert severity="info">{t('announcements.edit.info', { count: item.courseCount })}</Alert>
        <BroadcastFields state={state} currentImage={state.currentImage} />
        {(state.image ?? state.currentImage) && (
          <Button
            color="error"
            onClick={state.removeImage}
            sx={{ alignSelf: 'flex-start', minHeight: 44 }}
          >
            {t('announcements.edit.removeImage')}
          </Button>
        )}
      </Stack>
    </AppModal>
  );
};
