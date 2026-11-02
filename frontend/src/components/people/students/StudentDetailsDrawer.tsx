'use client';

import { useTranslation } from 'react-i18next';

import { useStudentDetails } from '@/api/students.api';
import { QueryState } from '@/components/common/QueryState';
import { SideDrawer } from '@/components/common/SideDrawer';

import { StudentDetailsContent } from './StudentDetailsContent';

import type { StudentRow } from '@/schemas/students.schema';
import type { FC } from 'react';

interface StudentDetailsDrawerProps {
  open: boolean;
  /** The clicked row (its name shows at once; the details load) */
  student: StudentRow | undefined;
  onClose: () => void;
}

/** Right side panel with one student's full details (read only). */
export const StudentDetailsDrawer: FC<StudentDetailsDrawerProps> = ({ open, student, onClose }) => {
  const { t } = useTranslation();
  const details = useStudentDetails(open ? student?._id : undefined);
  return (
    <SideDrawer
      open={open}
      title={student?.name ?? t('people.students.detailsTitle')}
      onClose={onClose}
      hideActions
      wide
    >
      <QueryState
        isLoading={details.isPending}
        error={details.error}
        onRetry={() => void details.refetch()}
        skeletonRows={6}
      >
        {details.data && <StudentDetailsContent details={details.data} />}
      </QueryState>
    </SideDrawer>
  );
};
