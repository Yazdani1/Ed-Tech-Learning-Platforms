'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';
import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { SetupManager } from './SetupManager';
import { SetupTabs } from './SetupTabs';

import type { SetupKind } from '@/schemas/setup.schema';
import type { FC } from 'react';

interface CourseSetupPageProps {
  /** Which list this route shows: /admin/categories or /admin/course-types */
  kind: SetupKind;
}

/** Course setup (Super Admin and Admin): categories and course types, one tab each. */
export const CourseSetupPage: FC<CourseSetupPageProps> = ({ kind }) => {
  const { t } = useTranslation();
  return (
    <RequireRole roles={MANAGER_ROLES}>
      <Box>
        <PageHeader title={t('showcase.setup.title')} subtitle={t('showcase.setup.subtitle')} />
        <SetupTabs kind={kind} />
        <SetupManager kind={kind} />
      </Box>
    </RequireRole>
  );
};
