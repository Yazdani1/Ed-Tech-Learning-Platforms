'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { isCloudinaryUrl } from '@/utils/urls';

import { TeacherCardFooter } from './TeacherCardFooter';
import { TeacherCardMenu, type TeacherAction } from './TeacherCardMenu';
import { CARD_EXPERTISE_COUNT, shortBio } from './teacher-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { AdminTeacher } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherCardProps {
  teacher: AdminTeacher;
  /** Undefined while the courses load */
  courseCount: number | undefined;
  linkedUser: ManagedUser | undefined;
  onAction: (action: TeacherAction, teacher: AdminTeacher) => void;
}

const AVATAR_SIZE = 96;

/** One teacher: photo, name, short bio, expertise, number of courses and the linked login account. */
export const TeacherCard: FC<TeacherCardProps> = ({
  teacher,
  courseCount,
  linkedUser,
  onAction,
}) => {
  const extra = teacher.expertise.length - CARD_EXPERTISE_COUNT;

  return (
    <Card
      variant="outlined"
      component="article"
      aria-label={teacher.name}
      sx={{ position: 'relative', height: '100%' }}
    >
      <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
        <TeacherCardMenu teacher={teacher} onAction={onAction} />
      </Box>
      <CardContent
        sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          height: '100%',
        }}
      >
        <Avatar
          src={isCloudinaryUrl(teacher.profileImage) ? teacher.profileImage : undefined}
          alt={teacher.name}
          sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, mb: 1.5, fontSize: 36, fontWeight: 800 }}
        >
          {teacher.name.charAt(0)}
        </Avatar>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 800, px: 3 }}>
          {teacher.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflowWrap: 'anywhere' }}>
          {shortBio(teacher.bio)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.75, mt: 2 }}>
          {teacher.expertise.slice(0, CARD_EXPERTISE_COUNT).map((item, index) => (
            <Chip key={`${item}-${index}`} label={item} size="small" variant="outlined" />
          ))}
          {extra > 0 && <Chip label={`+${extra}`} size="small" variant="outlined" />}
        </Box>
        <TeacherCardFooter courseCount={courseCount} linkedUser={linkedUser} />
      </CardContent>
    </Card>
  );
};
