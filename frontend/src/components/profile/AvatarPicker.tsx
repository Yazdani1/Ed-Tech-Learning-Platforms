'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AvatarUploadButton } from './AvatarUploadButton';

import type { FC } from 'react';

const PREVIEW_SIZE = 86;

interface AvatarPickerProps {
  name: string;
  color: string;
  preview: string | undefined;
  canRemove: boolean;
  error: string | null;
  disabled: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
}

/** Avatar preview with Upload (image, up to 5 MB) and Remove buttons. */
export const AvatarPicker: FC<AvatarPickerProps> = ({
  name,
  color,
  preview,
  canRemove,
  error,
  disabled,
  onPick,
  onRemove,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <Avatar
        src={preview}
        alt={t('profile.avatarAlt')}
        sx={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          bgcolor: color,
          fontSize: 32,
          fontWeight: 900,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <AvatarUploadButton disabled={disabled} onPick={onPick} />
          {canRemove && (
            <Button color="error" onClick={onRemove} disabled={disabled} sx={{ minHeight: 44 }}>
              {t('profile.removeAvatar')}
            </Button>
          )}
        </Box>
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          role={error ? 'alert' : undefined}
          sx={{ display: 'block', mt: 1 }}
        >
          {error ?? t('profile.avatarHint')}
        </Typography>
      </Box>
    </Box>
  );
};
