'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteTool } from '@/api/tools.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import { ToolLogo } from './ToolLogo';

import type { Tool } from '@/schemas/tools.schema';
import type { FC } from 'react';

interface ToolCardProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
}

/** A tool in the grid: logo, name under it, and a menu with Edit and Delete. */
export const ToolCard: FC<ToolCardProps> = ({ tool, onEdit }) => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const deleteTool = useDeleteTool();

  const handleDelete = async (): Promise<void> => {
    if (!(await confirmDelete(tool.name))) return;
    deleteTool.mutate(tool._id, {
      onSuccess: () => toast.success(t('showcase.setup.tool.deleted')),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <Paper
      variant="outlined"
      sx={{ position: 'relative', p: 2, pt: 3, textAlign: 'center', borderRadius: '4px' }}
    >
      <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
        <ActionMenu
          label={t('showcase.setup.actionsFor', { name: tool.name })}
          items={[
            {
              label: t('common.edit'),
              icon: <EditOutlinedIcon fontSize="small" />,
              onClick: () => {
                onEdit(tool);
              },
            },
            {
              label: t('common.delete'),
              icon: <DeleteOutlineIcon fontSize="small" />,
              danger: true,
              onClick: () => void handleDelete(),
            },
          ]}
        />
      </Box>
      <ToolLogo tool={tool} size={64} decorative />
      <Typography sx={{ mt: 1.5, fontWeight: 700, overflowWrap: 'anywhere' }}>
        {tool.name}
      </Typography>
    </Paper>
  );
};
