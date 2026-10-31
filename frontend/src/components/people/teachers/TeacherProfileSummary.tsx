'use client';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DetailItem } from '@/components/people/common/DetailItem';
import { formatDate } from '@/utils/dateTime';

import { TeacherSocialLinks } from './TeacherSocialLinks';

import type { ManagedUser } from '@/schemas/people.schema';
import type { AdminTeacher } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherProfileSummaryProps {
  teacher: AdminTeacher;
  linkedUser: ManagedUser | undefined;
  courseCount: number;
}

/** Name, email, bio, joined date, number of courses, expertise and safe social links. */
export const TeacherProfileSummary: FC<TeacherProfileSummaryProps> = ({
  teacher,
  linkedUser,
  courseCount,
}) => {
  const { t } = useTranslation();
  const joined = teacher.createdAt ?? linkedUser?.createdAt;
  const iconRow = { display: 'flex', gap: 1, alignItems: 'center' } as const;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" component="p" sx={{ fontWeight: 900 }}>
        {teacher.name}
      </Typography>
      {linkedUser && (
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {linkedUser.email}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
        {teacher.bio}
      </Typography>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2 }}
      >
        <DetailItem
          label={t('people.teachers.joined')}
          value={
            <Box sx={iconRow}>
              <CalendarTodayIcon fontSize="small" color="primary" aria-hidden />
              {joined ? formatDate(joined) : t('people.notAvailable')}
            </Box>
          }
        />
        <DetailItem
          label={t('people.teachers.teaching')}
          value={
            <Box sx={iconRow}>
              <MenuBookIcon fontSize="small" color="primary" aria-hidden />
              {t('people.teachers.assignedCount', { count: courseCount })}
            </Box>
          }
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
        {teacher.expertise.map((item, index) => (
          <Chip key={`${item}-${index}`} label={item} size="small" variant="outlined" />
        ))}
      </Box>
      <TeacherSocialLinks teacher={teacher} />
    </Box>
  );
};
