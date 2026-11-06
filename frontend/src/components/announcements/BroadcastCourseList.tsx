'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseThumb } from '@/components/course-picker/CourseThumb';

import type { BroadcastCourse } from '@/schemas/announcement-broadcast.schema';
import type { FC } from 'react';

interface BroadcastCourseListProps {
  courses: readonly BroadcastCourse[];
}

const THUMB_WIDTH = 64;

/** The courses an announcement went to, each with how many of its enrolled students saw it. */
export const BroadcastCourseList: FC<BroadcastCourseListProps> = ({ courses }) => {
  const { t } = useTranslation();
  return (
    <List disablePadding>
      {courses.map((course) => (
        <ListItem key={course._id} disableGutters sx={{ gap: 1.5, alignItems: 'center' }}>
          <CourseThumb coverImage={course.coverImage} width={THUMB_WIDTH} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
              {course.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('announcements.details.courseSeen', {
                seen: course.seenCount,
                total: course.studentCount,
              })}
            </Typography>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};
