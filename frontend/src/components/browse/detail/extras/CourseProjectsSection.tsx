'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useModal } from '@/hooks/useModal';

import { DetailSection, gridSx } from './DetailSection';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailsDrawer } from './ProjectDetailsDrawer';

import type { CourseProject } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

/** Light grey across the whole screen width */
const PROJECTS_BAND = '#eef1f5';

interface CourseProjectsSectionProps {
  projects: readonly CourseProject[];
}

/** The projects students build: a card each; clicking one opens the details in a right-side panel. */
export const CourseProjectsSection: FC<CourseProjectsSectionProps> = ({ projects }) => {
  const { t } = useTranslation();
  const details = useModal<CourseProject>();
  if (projects.length === 0) return null;
  return (
    <DetailSection
      id="course-projects"
      title={t('browse.extras.projectsTitle')}
      band={PROJECTS_BAND}
    >
      <Box component="ul" sx={gridSx(2)}>
        {projects.map((project, index) => (
          <ProjectCard
            key={`${project.title}-${index}`}
            project={project}
            onOpen={() => {
              details.openModal(project);
            }}
          />
        ))}
      </Box>
      <ProjectDetailsDrawer
        project={details.data}
        open={details.open}
        onClose={details.closeModal}
      />
    </DetailSection>
  );
};
