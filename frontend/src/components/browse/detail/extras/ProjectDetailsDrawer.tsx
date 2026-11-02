'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SideDrawer } from '@/components/common/SideDrawer';
import { CloudImage } from '@/components/common/CloudImage';

import { youTubeId } from '../../course-utils';
import { YouTubeEmbed } from '../YouTubeEmbed';

import { ProjectLinks } from './ProjectLinks';

import type { CourseProject } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface ProjectDetailsDrawerProps {
  project: CourseProject | undefined;
  open: boolean;
  onClose: () => void;
}

const PLAYER_SX = {
  position: 'relative',
  aspectRatio: '16 / 9',
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: 'common.black',
} as const;
const SHOT_SX = {
  width: '100%',
  aspectRatio: '16 / 10',
  borderRadius: 1,
  border: 1,
  borderColor: 'divider',
  bgcolor: 'grey.50',
} as const;

/** A project's full details: description, links, intro video (YouTube plays here) and every screenshot. */
export const ProjectDetailsDrawer: FC<ProjectDetailsDrawerProps> = ({ project, open, onClose }) => {
  const { t } = useTranslation();
  const videoId = youTubeId(project?.videoUrl);

  return (
    <SideDrawer open={open} onClose={onClose} title={project?.title ?? ''} hideActions wide>
      {project && (
        <Stack spacing={3}>
          {project.description && (
            <Typography sx={{ whiteSpace: 'pre-line' }}>{project.description}</Typography>
          )}
          <ProjectLinks
            liveDemoUrl={project.liveDemoUrl}
            externalVideoUrl={videoId ? '' : project.videoUrl}
          />
          {videoId && (
            <Box>
              <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {t('browse.extras.introVideo')}
              </Typography>
              <Box sx={PLAYER_SX}>
                <YouTubeEmbed videoId={videoId} title={project.title} />
              </Box>
            </Box>
          )}
          {project.images.length > 0 && (
            <Box>
              <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {t('browse.extras.screenshots')}
              </Typography>
              <Stack spacing={1.5}>
                {project.images.map((image, index) => (
                  <CloudImage
                    key={image.publicId}
                    url={image.url}
                    sizes="(max-width: 600px) 100vw, 800px"
                    fit="contain"
                    alt={t('browse.extras.screenshotAlt', {
                      name: project.title,
                      number: index + 1,
                    })}
                    sx={SHOT_SX}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </SideDrawer>
  );
};
