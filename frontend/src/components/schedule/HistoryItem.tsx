'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useDeleteSchedule } from '@/api/schedule.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';

import { HistoryItemDates } from './HistoryItemDates';
import { completedReminderSeconds, formatClock } from './schedule.utils';

import type { Schedule } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface HistoryItemProps {
  item: Schedule;
}

const WRAP_SX = { overflowWrap: 'anywhere' } as const;

/** One completed timer or reminder in the history list, with its studied time and a delete menu. */
export const HistoryItem: FC<HistoryItemProps> = ({ item }) => {
  const { t } = useTranslation();
  const remove = useDeleteSchedule();
  const confirmDelete = useDeleteConfirm();
  const toastResult = useToastResult();
  const isTimer = item.type === 'timer';
  const seconds = isTimer ? (item.duration ?? 0) : completedReminderSeconds(item);

  const askDelete = async (): Promise<void> => {
    if (!(await confirmDelete(item.title))) return;
    await toastResult(remove.mutateAsync(item._id), t('schedule.history.deleted'));
  };

  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, px: 2, py: 1.5 }}>
      {isTimer ? (
        <CheckCircleIcon color="success" sx={{ mt: 0.25 }} aria-hidden />
      ) : (
        <EventNoteIcon color="primary" sx={{ mt: 0.25 }} aria-hidden />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, ...WRAP_SX }}>{item.title}</Typography>
          {seconds > 0 && (
            <Chip
              label={formatClock(seconds)}
              size="small"
              variant="outlined"
              color={isTimer ? 'primary' : 'warning'}
              sx={{ fontFamily: 'monospace', fontWeight: 700 }}
            />
          )}
        </Box>
        {item.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', ...WRAP_SX }}
          >
            {item.description}
          </Typography>
        )}
        <HistoryItemDates item={item} />
      </Box>
      <ActionMenu
        label={t('schedule.history.actionsFor', { title: item.title })}
        items={[
          {
            label: t('schedule.history.delete'),
            icon: <DeleteOutlinedIcon fontSize="small" />,
            danger: true,
            disabled: remove.isPending,
            onClick: () => void askDelete(),
          },
        ]}
      />
    </Box>
  );
};
