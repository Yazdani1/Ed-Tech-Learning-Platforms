'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CloudImage } from '@/components/common/CloudImage';

import type { CourseProject } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface ProjectCardProps {
  project: CourseProject;
  onOpen: () => void;
}

const COVER_SX = {
  aspectRatio: '16 / 9',
  bgcolor: 'grey.100',
  display: 'grid',
  placeItems: 'center',
} as const;
const CLAMP_SX = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;

/** A project card: first screenshot, title, short description and "View project". */
export const ProjectCard: FC<ProjectCardProps> = ({ project, onOpen }) => {
  const { t } = useTranslation();
  const [cover] = project.images;
  return (
    <Paper
      component="li"
      variant="outlined"
      sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={COVER_SX}>
        {cover ? (
          <CloudImage
            url={cover.url}
            alt=""
            sizes="(max-width: 600px) 100vw, 400px"
            sx={{ width: '100%', height: '100%' }}
          />
        ) : (
          <WorkOutlineIcon color="disabled" sx={{ fontSize: 48 }} aria-hidden />
        )}
      </Box>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <Typography component="h3" sx={{ fontWeight: 800 }}>
          {project.title}
        </Typography>
        {project.description && (
          <Typography variant="body2" color="text.secondary" sx={CLAMP_SX}>
            {project.description}
          </Typography>
        )}
        <Button
          endIcon={<ArrowForwardIcon />}
          onClick={onOpen}
          aria-label={t('browse.extras.viewProjectNamed', { name: project.title })}
          sx={{ alignSelf: 'flex-start', mt: 'auto', minHeight: 44, px: 0 }}
        >
          {t('browse.extras.viewProject')}
        </Button>
      </Box>
    </Paper>
  );
};
