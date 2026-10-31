'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { useQuestionGroups } from '@/api/people.api';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { RequireRole } from '@/components/permissions/RequireRole';
import { ADMIN_AREA_ROLES } from '@/utils/roles';

import { CourseQuestionCard } from './CourseQuestionCard';

const PAGE_MAX_WIDTH = 1180;

/**
 * /admin/course-qa (Super Admin, Admin, Moderator): unresolved questions of every course. A question opens
 * in the course player's Q&A tab (answer, resolve), as in the old client.
 */
export const CourseQaPage = () => {
  const { t } = useTranslation();
  const query = useQuestionGroups();
  const groups = (query.data ?? []).filter((group) => group.questions.length > 0);
  const total = groups.reduce((sum, group) => sum + group.questions.length, 0);

  return (
    <RequireRole roles={ADMIN_AREA_ROLES}>
      <Box sx={{ maxWidth: PAGE_MAX_WIDTH }}>
        <PageHeader title={t('people.qa.title')} subtitle={t('people.qa.subtitle')} />
        <QueryState
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={groups.length === 0}
          emptyText={t('people.qa.empty')}
        >
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={t('people.qa.courseCount', { count: groups.length })} />
            <Chip label={t('people.qa.questionCount', { count: total })} />
          </Box>
          <Stack spacing={2.5}>
            {groups.map((group) => (
              <CourseQuestionCard key={group.course._id} group={group} />
            ))}
          </Stack>
        </QueryState>
      </Box>
    </RequireRole>
  );
};
