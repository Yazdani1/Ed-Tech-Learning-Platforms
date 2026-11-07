'use client';

import Box from '@mui/material/Box';

import { useStudents } from '@/api/students.api';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useRowSelection } from '@/hooks/useRowSelection';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { StudentDetailsDrawer } from './StudentDetailsDrawer';
import { StudentExportDialog } from './StudentExportDialog';
import { StudentsHeader } from './StudentsHeader';
import { StudentsList } from './StudentsList';
import { useStudentParams } from './useStudentParams';

import type { StudentRow } from '@/schemas/students.schema';

/**
 * The student list: count next to the title, search, every filter, paging, the details panel and (Super
 * Admin) tick boxes with the CSV export of the ticked or filtered students.
 */
export const StudentsManager = () => {
  const { params, setParams, courseIds, filters, activeFilters } = useStudentParams();
  const students = useStudents(filters);
  const details = useModal<StudentRow>();
  const exportModal = useModal();
  const selection = useRowSelection<StudentRow>();
  const canExport = useAuth().hasRole(SUPER_ADMIN_ROLES);
  return (
    <Box>
      <StudentsHeader
        params={params}
        setParams={setParams}
        courseIds={courseIds}
        activeFilters={activeFilters}
        total={students.data?.total}
        selectedCount={selection.selected.length}
        onClearSelection={selection.clear}
        onExport={() => {
          exportModal.openModal();
        }}
      />
      <StudentsList
        selection={canExport ? selection : undefined}
        query={students}
        hasFilters={activeFilters > 0 || params.search !== ''}
        onOpen={details.openModal}
        onPageChange={(page) => {
          setParams({ page });
        }}
      />
      <StudentDetailsDrawer
        open={details.open}
        student={details.data}
        onClose={details.closeModal}
      />
      {exportModal.open && (
        <StudentExportDialog
          onClose={exportModal.closeModal}
          selected={selection.selected}
          filters={filters}
          total={students.data?.total ?? 0}
        />
      )}
    </Box>
  );
};
