'use client';

import FilterList from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { PeopleSearchField } from '@/components/people/common/PeopleSearchField';
import { Can } from '@/components/permissions/Can';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { StudentFilterFields } from './StudentFilterFields';
import { StudentsExportActions } from './StudentsExportActions';

import type { StudentParams } from './useStudentParams';
import type { FC } from 'react';

const TOUCH_TARGET = 44;
const BUTTON_MAX_WIDTH = 260;

interface StudentsToolbarProps {
  params: StudentParams;
  onChange: (changes: Partial<Record<keyof StudentParams, string>>) => void;
  /** "All courses", one course title, or "3 courses" */
  courseLabel: string;
  courseCount: number;
  onChooseCourses: () => void;
  activeFilters: number;
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
}

/**
 * Search (only as wide as needed), the course picker, enrolment type, status, phone, joined between, sort,
 * and (Super Admin) the CSV export of the ticked or filtered students.
 */
export const StudentsToolbar: FC<StudentsToolbarProps> = ({
  params,
  onChange,
  courseLabel,
  courseCount,
  onChooseCourses,
  activeFilters,
  ...exportProps
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box sx={{ width: { xs: '100%', sm: 280 } }}>
        <PeopleSearchField
          value={params.search}
          onSearch={(search) => {
            onChange({ search });
          }}
          label={t('people.students.search')}
          placeholder={t('people.students.searchPlaceholder')}
        />
      </Box>
      <Badge badgeContent={courseCount} color="primary">
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={onChooseCourses}
          aria-label={t('people.students.chooseCourses', { course: courseLabel })}
          sx={{ minHeight: TOUCH_TARGET, maxWidth: BUTTON_MAX_WIDTH, textTransform: 'none' }}
        >
          <Box
            component="span"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {courseLabel}
          </Box>
        </Button>
      </Badge>
      <StudentFilterFields params={params} onChange={onChange} activeFilters={activeFilters} />
      <Can roles={SUPER_ADMIN_ROLES}>
        <StudentsExportActions {...exportProps} />
      </Can>
    </Box>
  );
};
