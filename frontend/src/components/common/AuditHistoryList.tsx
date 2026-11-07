'use client';

import HistoryIcon from '@mui/icons-material/History';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { QueryState } from './QueryState';

import type { AuditEntry } from '@/schemas/audit.schema';
import type { ApiError } from '@/services/http.service';
import type { FC, ReactNode } from 'react';

interface AuditHistoryListProps {
  entries: readonly AuditEntry[] | undefined;
  isPending: boolean;
  error: ApiError | null;
  onRetry: () => void;
  /** What changed, e.g. "15% → 7.5%" or "Student → Teacher" */
  describe: (entry: AuditEntry) => ReactNode;
  /** Accessible name of the list */
  label: string;
}

/** Who changed what and when, newest first (used by every "history" panel). */
export const AuditHistoryList: FC<AuditHistoryListProps> = ({
  entries,
  isPending,
  error,
  onRetry,
  describe,
  label,
}) => {
  const { t, i18n } = useTranslation();
  return (
    <QueryState
      isLoading={isPending}
      error={error}
      onRetry={onRetry}
      isEmpty={(entries ?? []).length === 0}
      emptyText={t('common.history.empty')}
      skeletonRows={3}
    >
      <List dense disablePadding aria-label={label}>
        {(entries ?? []).map((entry) => (
          <ListItem key={entry._id} divider alignItems="flex-start" sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
              <HistoryIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={<Box component="span">{describe(entry)}</Box>}
              secondary={
                <>
                  <Typography component="span" variant="caption" sx={{ display: 'block' }}>
                    {t('common.history.by', {
                      name: entry.actor?.name ?? t('common.history.unknown'),
                      role: entry.actor?.role ? t(`roles.${entry.actor.role}`) : '',
                      date: formatDateTime(entry.createdAt, i18n.language),
                    })}
                  </Typography>
                  {entry.note && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ display: 'block', fontStyle: 'italic' }}
                    >
                      {entry.note}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </QueryState>
  );
};
