'use client';

import AddIcon from '@mui/icons-material/Add';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { EXTRAS_MAX_ITEMS, type SuccessStory } from '@/schemas/course-extras.schema';

import { ExtrasListItem } from './ExtrasListItem';
import { ExtrasTabHeader } from './ExtrasTabHeader';
import { SuccessStoryFormModal } from './SuccessStoryFormModal';
import { useExtrasList } from './useExtrasList';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface SuccessStoriesTabProps {
  course: Course;
}

/** Course editor > Success stories: former students' stories, added / edited in a dialog. */
export const SuccessStoriesTab: FC<SuccessStoriesTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const stories = course.successStories;
  const list = useExtrasList<SuccessStory>(course._id, 'successStories', stories);
  const editing = list.form.data === undefined ? undefined : stories[list.form.data];

  return (
    <Box>
      <ExtrasTabHeader
        title={t('catalog.tabs.successStories')}
        hint={t('catalog.extras.stories.hint')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={stories.length >= EXTRAS_MAX_ITEMS}
            onClick={() => {
              list.form.openModal();
            }}
            sx={{ minHeight: 44 }}
          >
            {t('catalog.extras.stories.add')}
          </Button>
        }
      />
      {stories.length === 0 ? (
        <Typography color="text.secondary">{t('catalog.extras.stories.empty')}</Typography>
      ) : (
        <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
          {stories.map((story, index) => (
            <ExtrasListItem
              key={`${story.title}-${index}`}
              title={story.title}
              subtitle={story.companyName || story.description}
              media={<Avatar src={story.photo?.url} alt="" />}
              onEdit={() => {
                list.form.openModal(index);
              }}
              onDelete={() => void list.remove(index, story.title)}
            />
          ))}
        </Stack>
      )}
      <SuccessStoryFormModal
        courseId={course._id}
        open={list.form.open}
        story={editing}
        saving={list.isSaving}
        onClose={list.form.closeModal}
        onSave={(story) => {
          list.saveItem(story, list.form.data);
        }}
      />
    </Box>
  );
};
