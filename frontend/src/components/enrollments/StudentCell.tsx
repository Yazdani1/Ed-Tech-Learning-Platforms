'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { isSafeHttpUrl } from '@/utils/urls';

import type { EnrolledStudent } from '@/schemas/enrollment.schema';
import type { FC } from 'react';

interface StudentCellProps {
  student: EnrolledStudent;
}

const AVATAR_SIZE = 32;

/** Avatar and name of an enrolled student ("Deleted account" when the user no longer exists). */
export const StudentCell: FC<StudentCellProps> = ({ student }) => {
  const { t } = useTranslation();
  const name =
    student && student.name !== '' ? student.name : t('adminCourses.enrollments.deletedStudent');
  const avatar = student?.avatar && isSafeHttpUrl(student.avatar) ? student.avatar : undefined;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Avatar src={avatar} alt="" sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, fontSize: 13 }}>
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
        {name}
      </Typography>
    </Box>
  );
};
