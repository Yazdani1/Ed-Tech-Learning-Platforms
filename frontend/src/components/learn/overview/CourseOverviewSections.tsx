'use client';

import Box from '@mui/material/Box';

import { useLiveClasses } from '@/api/browse.api';
import { CourseAboutCard } from '@/components/browse/detail/CourseAboutCard';
import { CourseLearnList } from '@/components/browse/detail/CourseLearnList';
import { CourseScheduleCards } from '@/components/browse/detail/CourseScheduleCards';
import { CourseAudienceSection } from '@/components/browse/detail/extras/CourseAudienceSection';
import { CourseBenefitsSection } from '@/components/browse/detail/extras/CourseBenefitsSection';
import { CourseFaqSection } from '@/components/browse/detail/extras/CourseFaqSection';
import { CourseProjectsSection } from '@/components/browse/detail/extras/CourseProjectsSection';
import { CourseRequirementsSection } from '@/components/browse/detail/extras/CourseRequirementsSection';
import { CourseSuccessStories } from '@/components/browse/detail/extras/CourseSuccessStories';
import { CourseToolsSection } from '@/components/browse/detail/extras/CourseToolsSection';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseOverviewSectionsProps {
  course: Course;
}

/**
 * What the public course page shows, inside the course player's overview: schedule, about, what you learn,
 * tools, projects, benefits, audience, requirements, success stories and FAQ. The curriculum has its own tabs
 * and the instructors the Teachers tab.
 */
export const CourseOverviewSections: FC<CourseOverviewSectionsProps> = ({ course }) => {
  const weeks = useLiveClasses(course._id).data ?? [];
  return (
    <>
      <CourseScheduleCards course={course} weeks={weeks} />
      <CourseAboutCard description={course.description} />
      {/* The public course page's sections, except the curriculum (its own tabs here) and the instructors (Teachers tab) */}
      <Box sx={{ mx: { xs: -2, md: -4 } }}>
        <CourseLearnList items={course.whatYouWillLearn} />
        <CourseToolsSection section={course.toolsSection} />
        <CourseProjectsSection projects={course.projects} />
        <CourseBenefitsSection section={course.benefitsSection} />
        <CourseAudienceSection items={course.audience} />
        <CourseRequirementsSection items={course.requirements} />
        <CourseSuccessStories stories={course.successStories} />
        <CourseFaqSection faqs={course.faqs} />
      </Box>
    </>
  );
};
