'use client';

import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT } from '@/theme/fonts';

import { CARD_RADIUS, SOFT_BORDER } from './detail-styles';
import { InstructorPhoto } from './InstructorPhoto';

import type { TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface InstructorCardProps {
  teacher: TeacherRef;
  /** Position in the list: picks the colour of the photo circle */
  index: number;
}

const CARD_SX = {
  height: '100%',
  p: { xs: 2.5, sm: 4 },
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: { xs: 'center', sm: 'flex-start' },
  gap: { xs: 2, sm: 3.5 },
  bgcolor: '#f8fafc',
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: CARD_RADIUS,
} as const;
const BADGE_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.5,
  py: 0.5,
  mb: 1.5,
  maxWidth: '100%',
  borderRadius: 99,
  border: '1px dashed #60a5fa',
  bgcolor: '#eff6ff',
  color: '#1d4ed8',
  fontSize: '0.9rem',
  fontWeight: 600,
} as const;
const SKILLS_SX = {
  mt: 2.5,
  pt: 2.5,
  borderTop: `1px solid ${SOFT_BORDER}`,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  listStyle: 'none',
  pl: 0,
  mb: 0,
} as const;
const SKILL_SX = {
  px: 1.5,
  py: 0.75,
  borderRadius: '10px',
  bgcolor: 'common.white',
  border: `1px solid ${SOFT_BORDER}`,
  fontSize: '0.875rem',
  fontWeight: 600,
} as const;

/**
 * One teacher of the course: round photo (or initials) with a green dot, a badge with their main expertise,
 * the name, the bio and their other expertise at the bottom.
 */
export const InstructorCard: FC<InstructorCardProps> = ({ teacher, index }) => {
  const { t } = useTranslation();
  const [mainSkill, ...otherSkills] = teacher.expertise;
  return (
    <Box sx={CARD_SX}>
      <InstructorPhoto teacher={teacher} index={index} />
      <Box sx={{ minWidth: 0, flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
        <Box sx={BADGE_SX}>
          <VerifiedOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
          <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
            {mainSkill ?? t('browse.detail.instructorBadge')}
          </Box>
        </Box>
        <Typography
          component="h3"
          sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.25 }}
        >
          {teacher.name}
        </Typography>
        {teacher.bio && (
          <Typography sx={{ mt: 1.5, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {teacher.bio}
          </Typography>
        )}
        {otherSkills.length > 0 && (
          <Box
            component="ul"
            sx={{ ...SKILLS_SX, justifyContent: { xs: 'center', sm: 'flex-start' } }}
          >
            {otherSkills.map((skill) => (
              <Box component="li" key={skill} sx={SKILL_SX}>
                {skill}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
