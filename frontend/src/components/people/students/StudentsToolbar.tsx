'use client';

import FilterList from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { PeopleSearchField } from '@/components/people/common/PeopleSearchField';

import type { FC } from 'react';

const TOUCH_TARGET = 44;
const BUTTON_MAX_WIDTH = 360;

interface StudentsToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  /** "All courses", one course title, or "3 courses" */
  courseLabel: string;
  selectedCount: number;
  onChooseCourses: () => void;
}

/** Search (name, email, student number, phone) and the course filter button that opens the picker. */
export const StudentsToolbar: FC<StudentsToolbarProps> = ({
  search,
  onSearch,
  courseLabel,
  selectedCount,
  onChooseCourses,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        gap: 2,
        mb: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <PeopleSearchField
          value={search}
          onSearch={onSearch}
          label={t('people.students.search')}
          placeholder={t('people.students.searchPlaceholder')}
        />
      </Box>
      <Badge badgeContent={selectedCount} color="primary">
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={onChooseCourses}
          aria-label={t('people.students.chooseCourses', { course: courseLabel })}
          sx={{
            minHeight: TOUCH_TARGET,
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { sm: BUTTON_MAX_WIDTH },
            justifyContent: 'flex-start',
            textTransform: 'none',
          }}
        >
          <Box
            component="span"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {courseLabel}
          </Box>
        </Button>
      </Badge>
    </Box>
  );
};
