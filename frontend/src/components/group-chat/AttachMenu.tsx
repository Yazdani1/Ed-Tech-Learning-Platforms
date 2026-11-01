'use client';

import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ACCEPT_FILES, ACCEPT_IMAGES, ACCEPT_PDF } from './group-chat-utils';

import type { FC } from 'react';

interface AttachMenuProps {
  disabled: boolean;
  onPick: (files: FileList | null) => void;
}

const OPTIONS = [
  { key: 'uploadImage', accept: ACCEPT_IMAGES, icon: <ImageIcon color="primary" /> },
  { key: 'uploadPdf', accept: ACCEPT_PDF, icon: <DescriptionIcon color="error" /> },
  { key: 'uploadFile', accept: ACCEPT_FILES, icon: <InsertDriveFileIcon color="success" /> },
];

/** The "+" button: pick images, PDFs or other files (one hidden multi-file input). */
export const AttachMenu: FC<AttachMenuProps> = ({ disabled, onPick }) => {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = (accept: string): void => {
    setAnchor(null);
    if (!input.current) return;
    input.current.accept = accept;
    input.current.click();
  };

  return (
    <>
      <IconButton
        aria-label={t('groupChat.messages.attach')}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
        sx={{ width: 44, height: 44, bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
      >
        <AddIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => {
          setAnchor(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            onClick={() => {
              pick(option.accept);
            }}
            sx={{ minHeight: 44 }}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            {t(`groupChat.messages.${option.key}`)}
          </MenuItem>
        ))}
      </Menu>
      <input
        ref={input}
        hidden
        multiple
        type="file"
        data-testid="group-chat-file-input"
        onChange={(event) => {
          onPick(event.target.files);
          event.target.value = '';
        }}
      />
    </>
  );
};
