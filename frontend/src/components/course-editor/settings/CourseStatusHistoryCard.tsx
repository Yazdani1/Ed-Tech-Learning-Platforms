'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useCourseStatusHistory } from '@/api/course-editor.api';
import { AuditHistoryList } from '@/components/common/AuditHistoryList';

import type { FC } from 'react';

interface CourseStatusHistoryCardProps {
  courseId: string;
}

const CARD_SX = { p: { xs: 2, sm: 3 }, borderRadius: 2 } as const;

/** Who published or unpublished (archived) the course and when, newest first. */
export const CourseStatusHistoryCard: FC<CourseStatusHistoryCardProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const history = useCourseStatusHistory(courseId);
  return (
    <Paper variant="outlined" sx={CARD_SX}>
      <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>
        {t('catalog.settings.historyTitle')}
      </Typography>
      <AuditHistoryList
        entries={history.data}
        isPending={history.isPending}
        error={history.error}
        onRetry={() => void history.refetch()}
        label={t('catalog.settings.historyTitle')}
        describe={(entry) =>
          t(
            entry.action === 'course.publish'
              ? 'catalog.settings.historyPublished'
              : 'catalog.settings.historyUnpublished',
          )
        }
      />
    </Paper>
  );
};
