'use client';

import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl, isSafeHttpUrl } from '@/utils/urls';

import { isImageType, isPdfType } from './group-chat-utils';

import type { ChatAttachment } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface MessageAttachmentProps {
  file: ChatAttachment;
  mine: boolean;
}

const IMAGE_MAX_WIDTH = 320;
const IMAGE_MAX_HEIGHT = 260;

/** An attached file: images inline (Cloudinary only), everything else as a link that opens in a new tab. */
export const MessageAttachment: FC<MessageAttachmentProps> = ({ file, mine }) => {
  const { t } = useTranslation();
  if (!isSafeHttpUrl(file.url)) return null;

  if (isImageType(file.mimeType) && isCloudinaryUrl(file.url)) {
    return (
      <Box
        component="a"
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('groupChat.messages.openFile', { name: file.fileName })}
        sx={{ display: 'block', maxWidth: '100%' }}
      >
        <Image
          src={file.url}
          alt={file.fileName}
          width={IMAGE_MAX_WIDTH}
          height={IMAGE_MAX_HEIGHT}
          sizes={`${IMAGE_MAX_WIDTH}px`}
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: IMAGE_MAX_HEIGHT,
            borderRadius: 8,
            display: 'block',
            objectFit: 'cover',
            boxShadow: '0 10px 28px rgba(15,23,42,0.16)',
          }}
        />
      </Box>
    );
  }

  return (
    <Button
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      variant={mine ? 'outlined' : 'contained'}
      color={mine ? 'inherit' : 'primary'}
      size="small"
      startIcon={isPdfType(file.mimeType) ? <DescriptionIcon /> : <InsertDriveFileIcon />}
      sx={{ minHeight: 44, maxWidth: '100%', textTransform: 'none', justifyContent: 'flex-start' }}
    >
      <Box
        component="span"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {file.fileName}
      </Box>
    </Button>
  );
};
