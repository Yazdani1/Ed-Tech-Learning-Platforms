'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { QueryState } from '@/components/common/QueryState';
import { isCloudinaryUrl } from '@/utils/urls';

import { TeacherCourseRow } from './TeacherCourseRow';
import { TeacherProfileSummary } from './TeacherProfileSummary';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { ManagedUser } from '@/schemas/people.schema';
import type { AdminTeacher } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherDetailsModalProps {
  open: boolean;
  teacher: AdminTeacher | undefined;
  linkedUser: ManagedUser | undefined;
  courses: AdminCourse[];
  coursesLoading: boolean;
  coursesError: Error | null;
  onClose: () => void;
}

const AVATAR_SIZE = 132;

/** A teacher's profile, linked account, social links and the courses they teach. */
export const TeacherDetailsModal: FC<TeacherDetailsModalProps> = ({
  open,
  teacher,
  linkedUser,
  courses,
  coursesLoading,
  coursesError,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!teacher) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('people.teachers.detailsTitle')}
      cancelLabel={t('common.close')}
      maxWidth="lg"
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '200px 1fr' }, gap: 3 }}>
        <Stack spacing={1.5} sx={{ alignItems: { xs: 'flex-start', md: 'center' } }}>
          <Avatar
            src={isCloudinaryUrl(teacher.profileImage) ? teacher.profileImage : undefined}
            alt={teacher.name}
            sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, fontSize: 48, fontWeight: 900 }}
          >
            {teacher.name.charAt(0)}
          </Avatar>
          <Chip
            label={t(linkedUser ? 'people.teachers.linked' : 'people.teachers.notLinked')}
            color={linkedUser ? 'primary' : 'default'}
            variant="outlined"
          />
        </Stack>
        <TeacherProfileSummary
          teacher={teacher}
          linkedUser={linkedUser}
          courseCount={courses.length}
        />
      </Box>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 2 }}>
        {t('people.teachers.assignedCourses')}
      </Typography>
      <QueryState
        isLoading={coursesLoading}
        error={coursesError}
        isEmpty={courses.length === 0}
        emptyText={t('people.teachers.noCourses')}
        skeletonRows={2}
      >
        <Stack spacing={1.25}>
          {courses.map((course) => (
            <TeacherCourseRow key={course._id} course={course} />
          ))}
        </Stack>
      </QueryState>
    </AppModal>
  );
};
