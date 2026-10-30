'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { ExpertiseChips } from './ExpertiseChips';
import { TeacherAvatar } from './TeacherAvatar';
import { TeacherSocialLinks } from './TeacherSocialLinks';

import type { TeacherProfile } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherProfileCardProps {
  teacher: TeacherProfile;
}

const BAND_HEIGHT = 108;
const AVATAR_SIZE = 96;
const MAX_EXPERTISE = 4;

/** A teacher on /teachers: photo, name, subjects, bio and social links. */
export const TeacherProfileCard: FC<TeacherProfileCardProps> = ({ teacher }) => (
  <Card
    component="article"
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: 2,
      border: 1,
      borderColor: 'divider',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 18px 42px rgba(15,23,42,0.12)' },
    }}
  >
    <TeacherAvatar teacher={teacher} bandHeight={BAND_HEIGHT} size={AVATAR_SIZE} />
    <Box
      sx={{
        pt: 7,
        px: 3,
        pb: 3,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" component="h2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
        {teacher.name}
      </Typography>
      <ExpertiseChips expertise={teacher.expertise} max={MAX_EXPERTISE} />
      {teacher.bio && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 2,
            lineHeight: 1.7,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {teacher.bio}
        </Typography>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <TeacherSocialLinks teacher={teacher} />
    </Box>
  </Card>
);
