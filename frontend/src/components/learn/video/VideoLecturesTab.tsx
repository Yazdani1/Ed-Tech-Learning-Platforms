'use client';

import Box from '@mui/material/Box';

import { QaSection } from '../qa/QaSection';

import { LectureList } from './LectureList';
import { LecturePlayer } from './LecturePlayer';

import type { Course, CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface VideoLecturesTabProps {
  course: Course;
  activeLecture: CourseLecture | null;
  onSelectLecture: (lectureId: string) => void;
}

const LIST_WIDTH = 320;

/**
 * The video player with the lecture's title and the course Q&A underneath, and the course content list
 * (right from 1200 px, under the video on smaller screens).
 */
export const VideoLecturesTab: FC<VideoLecturesTabProps> = ({
  course,
  activeLecture,
  onSelectLecture,
}) => (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <LecturePlayer lecture={activeLecture} />
      <Box sx={{ display: { lg: 'none' } }}>
        <LectureList course={course} activeLecture={activeLecture} onSelect={onSelectLecture} />
      </Box>
      <QaSection courseId={course._id} />
    </Box>
    <Box
      sx={{
        display: { xs: 'none', lg: 'block' },
        width: LIST_WIDTH,
        flexShrink: 0,
        borderLeft: 1,
        borderColor: 'divider',
      }}
    >
      <LectureList course={course} activeLecture={activeLecture} onSelect={onSelectLecture} />
    </Box>
  </Box>
);
