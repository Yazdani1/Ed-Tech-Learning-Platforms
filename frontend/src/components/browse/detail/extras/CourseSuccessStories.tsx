'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { DetailSection, gridSx } from './DetailSection';
import { SuccessStoryCard } from './SuccessStoryCard';

import type { SuccessStory } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseSuccessStoriesProps {
  stories: readonly SuccessStory[];
}

/** Success stories of former students, two cards per row from tablet width. */
export const CourseSuccessStories: FC<CourseSuccessStoriesProps> = ({ stories }) => {
  const { t } = useTranslation();
  if (stories.length === 0) return null;
  return (
    <DetailSection id="course-stories" title={t('browse.extras.storiesTitle')}>
      <Box component="ul" sx={gridSx(2, 3)}>
        {stories.map((story, index) => (
          <SuccessStoryCard key={`${story.title}-${index}`} story={story} />
        ))}
      </Box>
    </DetailSection>
  );
};
