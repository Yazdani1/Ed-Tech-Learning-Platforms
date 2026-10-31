'use client';

import MenuBookIcon from '@mui/icons-material/MenuBook';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { RoleChip } from '@/components/people/users/RoleChip';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

interface TeacherCardFooterProps {
  /** Undefined while the courses load */
  courseCount: number | undefined;
  linkedUser: ManagedUser | undefined;
}

/** Bottom of a teacher card: how many courses they teach and the linked login account. */
export const TeacherCardFooter: FC<TeacherCardFooterProps> = ({ courseCount, linkedUser }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mt: 'auto', pt: 2, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 1.5,
          mb: 1.5,
        }}
      >
        <MenuBookIcon sx={{ fontSize: 18, color: 'primary.main' }} aria-hidden />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {courseCount === undefined
            ? t('people.teachers.loadingCourses')
            : t('people.teachers.teachingCount', { count: courseCount })}
        </Typography>
      </Box>
      {linkedUser ? (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {linkedUser.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', overflowWrap: 'anywhere', mb: 1 }}
          >
            {linkedUser.email}
          </Typography>
          <RoleChip role={linkedUser.role} />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('people.teachers.notLinked')}
        </Typography>
      )}
    </Box>
  );
};
