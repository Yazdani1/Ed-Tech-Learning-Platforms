'use client';

import Box from '@mui/material/Box';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { AddButton } from '@/components/people/common/AddButton';
import { useModal } from '@/hooks/useModal';

import { TeacherCard } from './TeacherCard';
import { TeacherDetailsModal } from './TeacherDetailsModal';
import { TeacherFormModal } from './TeacherFormModal';
import { useTeachersData } from './useTeachersData';

import type { TeacherAction } from './TeacherCardMenu';
import type { AdminTeacher } from '@/schemas/public.schema';

const GRID_COLUMNS = {
  xs: '1fr',
  sm: 'repeat(2, minmax(0, 1fr))',
  lg: 'repeat(3, minmax(0, 1fr))',
  xl: 'repeat(4, minmax(0, 1fr))',
};

/** Teacher cards with Add / Edit / Delete / View details. */
export const TeachersManager = () => {
  const { t } = useTranslation();
  const { teachers, courses, findAccount, coursesOf, linkableUsers } = useTeachersData();
  const formModal = useModal<AdminTeacher>();
  const detailsModal = useModal<AdminTeacher>();
  const onAction = useCallback(
    (action: TeacherAction, teacher: AdminTeacher) => {
      (action === 'edit' ? formModal : detailsModal).openModal(teacher);
    },
    [formModal, detailsModal],
  );
  const list = teachers.data ?? [];
  const shown = detailsModal.data;
  const openAdd = (): void => {
    formModal.openModal();
  };

  return (
    <Box>
      <PageHeader
        title={t('people.teachers.title')}
        actions={<AddButton label={t('people.teachers.add')} onClick={openAdd} />}
      />
      <QueryState
        isLoading={teachers.isLoading}
        error={teachers.error}
        onRetry={() => void teachers.refetch()}
        isEmpty={list.length === 0}
        emptyText={t('people.teachers.empty')}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: 2.5 }}>
          {list.map((teacher) => (
            <TeacherCard
              key={teacher._id}
              teacher={teacher}
              courseCount={coursesOf(teacher._id)?.length}
              linkedUser={findAccount(teacher.userId)}
              onAction={onAction}
            />
          ))}
        </Box>
      </QueryState>
      <TeacherFormModal
        open={formModal.open}
        teacher={formModal.data}
        linkableUsers={linkableUsers(formModal.data?.userId)}
        onClose={formModal.closeModal}
      />
      <TeacherDetailsModal
        open={detailsModal.open}
        teacher={shown}
        linkedUser={findAccount(shown?.userId)}
        courses={shown ? (coursesOf(shown._id) ?? []) : []}
        coursesLoading={courses.isLoading}
        coursesError={courses.error}
        onClose={detailsModal.closeModal}
      />
    </Box>
  );
};
