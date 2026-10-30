'use client';

import EditIcon from '@mui/icons-material/Edit';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/permissions/Can';

import { IconTextList, type IconTextItem } from '../IconTextList';

import type { FC } from 'react';

interface StaffCourseActionsProps {
  courseId: string;
  highlights: readonly IconTextItem[];
}

/** Super Admin and Admin edit the course; every staff member (Moderator too) opens the student view. */
export const StaffCourseActions: FC<StaffCourseActionsProps> = ({ courseId, highlights }) => {
  const { t } = useTranslation();
  return (
    <>
      <Stack spacing={1.5}>
        <Can roles={['Super Admin', 'Admin']}>
          <Button
            component={Link}
            href={`/admin/courses/${courseId}/edit`}
            fullWidth
            variant="contained"
            size="large"
            startIcon={<EditIcon />}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {t('browse.enroll.editCourse')}
          </Button>
        </Can>
        <Button
          component={Link}
          href={`/admin/courses/${courseId}/learn`}
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<VisibilityOutlinedIcon />}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {t('browse.enroll.studentView')}
        </Button>
      </Stack>
      <Box sx={{ mt: 2 }}>
        <IconTextList items={highlights} />
      </Box>
    </>
  );
};
