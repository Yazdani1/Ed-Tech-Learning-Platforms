'use client';

import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { AVATAR_ACCEPT } from '@/schemas/profile.schema';

import type { FC } from 'react';

interface AvatarUploadButtonProps {
  disabled: boolean;
  onPick: (file: File | undefined) => void;
}

/** "Upload Avatar": opens the file picker (images only). */
export const AvatarUploadButton: FC<AvatarUploadButtonProps> = ({ disabled, onPick }) => {
  const { t } = useTranslation();
  return (
    <Button
      component="label"
      variant="outlined"
      startIcon={<PhotoCameraOutlined />}
      disabled={disabled}
      sx={{ minHeight: 44 }}
    >
      {t('profile.uploadAvatar')}
      <input
        hidden
        type="file"
        accept={AVATAR_ACCEPT}
        aria-label={t('profile.uploadAvatar')}
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          // The same file can be picked again after a removal
          event.target.value = '';
        }}
      />
    </Button>
  );
};
