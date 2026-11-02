'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SideDrawer } from '@/components/common/SideDrawer';
import { useOnOpen } from '@/hooks/useOnOpen';
import {
  projectFormSchema,
  type CourseImage,
  type CourseProject,
  type ProjectForm,
} from '@/schemas/course-extras.schema';

import { ProjectFields } from './ProjectFields';
import { ProjectImagesField } from './ProjectImagesField';

import type { FC } from 'react';

interface ProjectFormDrawerProps {
  courseId: string;
  open: boolean;
  /** The project being edited; undefined to add one */
  project: CourseProject | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (project: CourseProject) => void;
}

const EMPTY: ProjectForm = { title: '', description: '', liveDemoUrl: '', videoUrl: '' };

const formValues = (project: CourseProject | undefined): ProjectForm =>
  project
    ? {
        title: project.title,
        description: project.description,
        liveDemoUrl: project.liveDemoUrl,
        videoUrl: project.videoUrl,
      }
    : EMPTY;

/** Right-side panel: a project's title, description, screenshots, live demo link and intro video link. */
export const ProjectFormDrawer: FC<ProjectFormDrawerProps> = ({
  courseId,
  open,
  project,
  saving,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<CourseImage[]>([]);
  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: EMPTY,
  });
  const { reset } = form;
  useOnOpen(open, () => {
    setImages(project?.images ?? []);
  });
  useEffect(() => {
    if (open) reset(formValues(project));
  }, [open, project, reset]);

  const submit = form.handleSubmit((values) => {
    onSave({ ...values, images });
  });

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={t(project ? 'catalog.extras.projects.edit' : 'catalog.extras.projects.add')}
      onSave={() => void submit()}
      saveLabel={t('common.save')}
      saving={saving}
      wide
    >
      <Stack spacing={2.5}>
        <ProjectFields
          form={form}
          screenshots={
            <ProjectImagesField
              courseId={courseId}
              images={images}
              onAdd={(added) => {
                setImages((current) => [...current, ...added]);
              }}
              onRemove={(publicId) => {
                setImages((current) => current.filter((image) => image.publicId !== publicId));
              }}
            />
          }
        />
      </Stack>
    </SideDrawer>
  );
};
