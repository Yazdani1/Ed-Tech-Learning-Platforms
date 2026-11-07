'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useBroadcastHistory } from '@/api/announcements.api';
import { AppModal } from '@/components/common/AppModal';
import { AuditHistoryList } from '@/components/common/AuditHistoryList';
import { auditValue, type AuditEntry } from '@/schemas/audit.schema';
import { htmlToPlainText } from '@/utils/html-text';

import type { FC, ReactNode } from 'react';

interface BroadcastHistoryModalProps {
  /** (Mounted only while open.) */
  id: string;
  title: string;
  onClose: () => void;
}

const EXCERPT = 160;

const excerpt = (html: string): string => {
  const text = htmlToPlainText(html);
  return text.length > EXCERPT ? `${text.slice(0, EXCERPT)}…` : text;
};

/** Every edit of the announcement: the old and new title / text / picture, who changed it and when. */
export const BroadcastHistoryModal: FC<BroadcastHistoryModalProps> = ({ id, title, onClose }) => {
  const { t } = useTranslation();
  const history = useBroadcastHistory(id);
  const describe = (entry: AuditEntry): ReactNode => {
    const changes: string[] = [];
    const before = (key: string) => auditValue(entry.before, key);
    const after = (key: string) => auditValue(entry.after, key);
    if (before('title') !== after('title'))
      changes.push(
        t('announcements.history.titleChanged', { from: before('title'), to: after('title') }),
      );
    if (before('description') !== after('description'))
      changes.push(
        t('announcements.history.textChanged', { from: excerpt(before('description')) }),
      );
    if (before('image') !== after('image')) changes.push(t('announcements.history.imageChanged'));
    return (
      <Box component="span" sx={{ display: 'grid', gap: 0.5 }}>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          {t('announcements.history.edited')}
        </Typography>
        {changes.map((change) => (
          <Typography
            key={change}
            component="span"
            variant="body2"
            sx={{ overflowWrap: 'anywhere' }}
          >
            {change}
          </Typography>
        ))}
      </Box>
    );
  };
  return (
    <AppModal
      open
      onClose={onClose}
      title={t('announcements.history.title', { title })}
      hideActions
    >
      <AuditHistoryList
        entries={history.data}
        isPending={history.isPending}
        error={history.error}
        onRetry={() => void history.refetch()}
        label={t('announcements.history.title', { title })}
        describe={describe}
      />
    </AppModal>
  );
};
