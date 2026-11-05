'use client';

import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CloudImage } from '@/components/common/CloudImage';

import { CARD_RADIUS, SOFT_BORDER } from '../detail-styles';

import type { CourseProject } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface ProjectCardProps {
  project: CourseProject;
  onOpen: () => void;
}

const CARD_SX = {
  width: '100%',
  height: '100%',
  p: { xs: 1.5, sm: 2.5 },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: { xs: 1.5, sm: 2.5 },
  textAlign: 'left',
  bgcolor: 'common.white',
  border: `2px solid ${SOFT_BORDER}`,
  borderRadius: CARD_RADIUS,
  transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
  '& img': { transition: 'transform 0.4s ease' },
  '&:hover, &.Mui-focusVisible': {
    borderColor: '#2563eb',
    transform: 'translateY(-4px)',
    boxShadow: '0 14px 30px rgba(37,99,235,0.16)',
  },
  '&:hover img': { transform: 'scale(1.06)' },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover, &.Mui-focusVisible': { transform: 'none' },
    '&:hover img': { transform: 'none' },
  },
} as const;
const COVER_SX = {
  width: { xs: 96, sm: 168 },
  height: { xs: 96, sm: 168 },
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '12px',
  bgcolor: 'grey.100',
  display: 'grid',
  placeItems: 'center',
} as const;

/** A project: first screenshot on the left, title and a one-line description; the card opens the details. */
export const ProjectCard: FC<ProjectCardProps> = ({ project, onOpen }) => {
  const { t } = useTranslation();
  const [cover] = project.images;
  return (
    <Box component="li" sx={{ minWidth: 0 }}>
      <ButtonBase
        onClick={onOpen}
        aria-label={t('browse.extras.viewProjectNamed', { name: project.title })}
        sx={CARD_SX}
      >
        <Box sx={COVER_SX}>
          {cover ? (
            <CloudImage
              url={cover.url}
              alt=""
              sizes="168px"
              sx={{ width: '100%', height: '100%' }}
            />
          ) : (
            <WorkOutlineIcon color="disabled" sx={{ fontSize: 48 }} aria-hidden />
          )}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component="span"
            noWrap
            sx={{ display: 'block', fontWeight: 600, fontSize: '1.2rem' }}
          >
            {project.title}
          </Typography>
          {project.description && (
            <Typography
              component="span"
              noWrap
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {project.description}
            </Typography>
          )}
        </Box>
      </ButtonBase>
    </Box>
  );
};
