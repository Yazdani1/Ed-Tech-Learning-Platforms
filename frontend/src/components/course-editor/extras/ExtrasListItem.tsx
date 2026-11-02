'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import type { FC, ReactNode } from 'react';

interface ExtrasListItemProps {
  title: string;
  subtitle?: string;
  /** Picture on the left (thumbnail, avatar) */
  media?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

/** One saved item of a section list (project, success story, question): picture, text, Edit / Delete menu. */
export const ExtrasListItem: FC<ExtrasListItemProps> = ({
  title,
  subtitle,
  media,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
      {media}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{title}</Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <ActionMenu
        label={t('catalog.extras.actionsFor', { name: title })}
        items={[
          { label: t('common.edit'), icon: <EditOutlinedIcon fontSize="small" />, onClick: onEdit },
          {
            label: t('common.delete'),
            icon: <DeleteOutlineIcon fontSize="small" />,
            danger: true,
            onClick: onDelete,
          },
        ]}
      />
    </Paper>
  );
};
