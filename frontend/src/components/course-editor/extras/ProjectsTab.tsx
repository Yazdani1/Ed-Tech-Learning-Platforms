'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { EXTRAS_MAX_ITEMS, type CourseProject } from '@/schemas/course-extras.schema';
import { CloudImage } from '@/components/common/CloudImage';

import { ExtrasListItem } from './ExtrasListItem';
import { ExtrasTabHeader } from './ExtrasTabHeader';
import { ProjectFormDrawer } from './ProjectFormDrawer';
import { useExtrasList } from './useExtrasList';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface ProjectsTabProps {
  course: Course;
}

const THUMB_SX = {
  width: 72,
  height: 48,
  borderRadius: 1,
  objectFit: 'cover',
  flexShrink: 0,
  bgcolor: 'grey.100',
} as const;

/** Course editor > Projects: the projects students build; each is added / edited in a right-side panel. */
export const ProjectsTab: FC<ProjectsTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const list = useExtrasList<CourseProject>(course._id, 'projects', course.projects);
  const editing = list.form.data === undefined ? undefined : course.projects[list.form.data];

  return (
    <Box>
      <ExtrasTabHeader
        title={t('catalog.tabs.projects')}
        hint={t('catalog.extras.projects.hint')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={course.projects.length >= EXTRAS_MAX_ITEMS}
            onClick={() => {
              list.form.openModal();
            }}
            sx={{ minHeight: 44 }}
          >
            {t('catalog.extras.projects.add')}
          </Button>
        }
      />
      {course.projects.length === 0 ? (
        <Typography color="text.secondary">{t('catalog.extras.projects.empty')}</Typography>
      ) : (
        <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
          {course.projects.map((project, index) => (
            <ExtrasListItem
              key={`${project.title}-${index}`}
              title={project.title}
              subtitle={project.description}
              media={
                project.images[0] ? (
                  <CloudImage url={project.images[0].url} alt="" sizes="72px" sx={THUMB_SX} />
                ) : undefined
              }
              onEdit={() => {
                list.form.openModal(index);
              }}
              onDelete={() => void list.remove(index, project.title)}
            />
          ))}
        </Stack>
      )}
      <ProjectFormDrawer
        courseId={course._id}
        open={list.form.open}
        project={editing}
        saving={list.isSaving}
        onClose={list.form.closeModal}
        onSave={(project) => {
          list.saveItem(project, list.form.data);
        }}
      />
    </Box>
  );
};
