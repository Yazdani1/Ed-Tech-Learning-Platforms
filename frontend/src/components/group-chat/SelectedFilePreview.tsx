'use client';

import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { isPdfType } from './group-chat-utils';

import type { PickedFile } from '@/hooks/useGroupChatFiles';
import type { FC } from 'react';

interface SelectedFilePreviewProps {
  item: PickedFile;
  onRemove: (id: string) => void;
}

/** A file waiting to be sent: image thumbnail or file icon + name, with a remove button. */
export const SelectedFilePreview: FC<SelectedFilePreviewProps> = ({ item, onRemove }) => {
  const { t } = useTranslation();
  const { file, previewUrl } = item;

  return (
    <Box
      sx={{
        position: 'relative',
        width: previewUrl ? 86 : 'auto',
        minWidth: previewUrl ? 86 : 120,
        maxWidth: 160,
        height: 72,
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      {previewUrl ? (
        <Image src={previewUrl} alt={file.name} fill unoptimized style={{ objectFit: 'cover' }} />
      ) : (
        <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', px: 1 }}>
          {isPdfType(file.type) ? (
            <DescriptionIcon color="error" />
          ) : (
            <InsertDriveFileIcon color="success" />
          )}
          <Typography variant="caption" noWrap sx={{ maxWidth: 104 }}>
            {file.name}
          </Typography>
        </Stack>
      )}
      <IconButton
        size="small"
        aria-label={t('groupChat.messages.removeFile', { name: file.name })}
        onClick={() => {
          onRemove(item.id);
        }}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          // 44 px touch target; the visible dark circle is the icon itself
          width: 44,
          height: 44,
          color: '#fff',
          '& svg': { bgcolor: 'rgba(15,23,42,0.72)', borderRadius: '50%', p: '3px' },
          '&:hover svg': { bgcolor: 'rgba(15,23,42,0.9)' },
        }}
      >
        <CloseIcon sx={{ fontSize: 22 }} />
      </IconButton>
    </Box>
  );
};
