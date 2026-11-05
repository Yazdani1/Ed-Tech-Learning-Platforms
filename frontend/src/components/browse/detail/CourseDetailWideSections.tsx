'use client';

import { courseSections } from '../course-utils';

import { CourseContentTabs } from './content/CourseContentTabs';
import { CourseInstructors } from './CourseInstructors';
import { CourseLearnList } from './CourseLearnList';
import { CourseAudienceSection } from './extras/CourseAudienceSection';
import { CourseBenefitsSection } from './extras/CourseBenefitsSection';
import { CourseFaqSection } from './extras/CourseFaqSection';
import { CourseProjectsSection } from './extras/CourseProjectsSection';
import { CourseRequirementsSection } from './extras/CourseRequirementsSection';
import { CourseSuccessStories } from './extras/CourseSuccessStories';
import { CourseToolsSection } from './extras/CourseToolsSection';

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
 * The course page sections that use the full page width, under "About this course" and the enrolment card:
 * what you learn, curriculum, instructors, tools, projects, what you get, audience, requirements, success
 * stories and the FAQ.
 */
export const CourseDetailWideSections: FC<CourseDetailWideSectionsProps> = ({
  course,
  weeks,
  quizSections,
  onPreview,
}) => (
  <>
    <CourseLearnList items={course.whatYouWillLearn} />
    <CourseContentTabs
      courseId={course._id}
      sections={courseSections(course)}
      weeks={weeks}
      quizSections={quizSections}
      onPreview={onPreview}
    />
    <CourseInstructors teachers={course.teachers} />
    <CourseToolsSection section={course.toolsSection} />
    <CourseProjectsSection projects={course.projects} />
    <CourseBenefitsSection section={course.benefitsSection} />
    <CourseAudienceSection items={course.audience} />
    <CourseRequirementsSection items={course.requirements} />
    <CourseSuccessStories stories={course.successStories} />
    <CourseFaqSection faqs={course.faqs} />
  </>
);
