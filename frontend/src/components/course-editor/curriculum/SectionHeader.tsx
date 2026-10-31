'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { IconAction } from '../common/IconAction';
import { SortHandle } from '../common/SortHandle';

import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { FC } from 'react';

interface SectionHeaderProps {
  title: string;
  handleProps: DraggableProvidedDragHandleProps | null;
  onRename: () => void;
  onDelete: () => void;
}

const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  pr: 0.5,
  py: 0.5,
  bgcolor: 'grey.50',
  borderBottom: 1,
  borderColor: 'divider',
} as const;

/** The top bar of a section card: drag handle, title, rename and delete. */
export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  handleProps,
  onRename,
  onDelete,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={HEADER_SX}>
      <SortHandle
        handleProps={handleProps}
        label={t('catalog.curriculum.dragSection', { name: title })}
      />
      <Typography component="h3" sx={{ flex: 1, fontWeight: 600, wordBreak: 'break-word' }}>
        {title}
      </Typography>
      <IconAction
        label={t('catalog.curriculum.renameSectionNamed', { name: title })}
        icon={<EditIcon fontSize="small" />}
        onClick={onRename}
      />
      <IconAction
        label={t('catalog.curriculum.deleteSectionNamed', { name: title })}
        icon={<DeleteIcon fontSize="small" />}
        color="error"
        onClick={onDelete}
      />
    </Box>
  );
};
