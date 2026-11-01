'use client';

import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import { initial, safeImage } from '../common/community-utils';

import type { FC } from 'react';

const ARCHIVED_OPACITY = 0.55;

interface AdminItemRowProps {
  name: string;
  imageUrl: string | null | undefined;
  caption: string;
  isArchived: boolean;
  onEdit: () => void;
  onArchive: () => void;
}

/** A channel or badge in the settings lists; archived ones are faded and have no actions. */
export const AdminItemRow: FC<AdminItemRowProps> = ({
  name,
  imageUrl,
  caption,
  isArchived,
  onEdit,
  onArchive,
}) => {
  const { t } = useTranslation();
  return (
    <Paper
      component="li"
      elevation={0}
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        opacity: isArchived ? ARCHIVED_OPACITY : 1,
        listStyle: 'none',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Avatar src={safeImage(imageUrl)} alt="" variant="rounded">
          {initial(name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, wordBreak: 'break-word' }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {isArchived ? t('community.admin.archivedLabel') : caption}
          </Typography>
        </Box>
        {!isArchived && (
          <ActionMenu
            label={t('community.admin.actionsFor', { name })}
            items={[
              {
                label: t('common.edit'),
                icon: <EditOutlinedIcon fontSize="small" />,
                onClick: onEdit,
              },
              {
                label: t('community.admin.archive'),
                icon: <ArchiveOutlinedIcon fontSize="small" />,
                onClick: onArchive,
                danger: true,
              },
            ]}
          />
        )}
      </Stack>
    </Paper>
  );
};
