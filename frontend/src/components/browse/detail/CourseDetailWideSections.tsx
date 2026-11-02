'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import { courseSections } from '../course-utils';

import { CourseContentTabs } from './content/CourseContentTabs';
import { CourseInstructors } from './CourseInstructors';
import { CourseTextSections } from './CourseTextSections';
import { CourseAudienceSection } from './extras/CourseAudienceSection';
import { CourseFaqSection } from './extras/CourseFaqSection';
import { CourseProjectsSection } from './extras/CourseProjectsSection';
import { CourseSuccessStories } from './extras/CourseSuccessStories';

import type { Course, CourseLecture, LiveClassWeek } from '@/schemas/browse.schema';
import type { PublicQuizSection } from '@/schemas/practice-quiz.schema';
import type { FC } from 'react';

interface CourseDetailWideSectionsProps {
  course: Course;
  weeks: readonly LiveClassWeek[];
  quizSections: readonly PublicQuizSection[];
  onPreview: (lecture: CourseLecture) => void;
}

/**
 * The course page sections that use the full page width, under the course type card and the enrolment card:
 * curriculum, projects, audience, requirements / description, instructors, success stories, FAQ.
 */
export const CourseDetailWideSections: FC<CourseDetailWideSectionsProps> = ({
  course,
  weeks,
  quizSections,
  onPreview,
}) => (
  <Box sx={{ mt: { xs: 1, md: 2 } }}>
    <Divider sx={{ mb: 4 }} />
    <CourseContentTabs
      courseId={course._id}
      sections={courseSections(course)}
      weeks={weeks}
      quizSections={quizSections}
      onPreview={onPreview}
    />
    <CourseProjectsSection projects={course.projects} />
    <CourseAudienceSection items={course.audience} />
    <CourseTextSections requirements={course.requirements} description={course.description} />
    <Divider sx={{ mb: 4 }} />
    <CourseInstructors teachers={course.teachers} />
    <CourseSuccessStories stories={course.successStories} />
    <CourseFaqSection faqs={course.faqs} />
  </Box>
);
