'use client';

import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

import { useLiveClasses, usePublicQuizSections } from '@/api/browse.api';
import { useModal } from '@/hooks/useModal';

import { countLectures, courseSections, previewLectures } from '../course-utils';

import { CourseContentTabs } from './content/CourseContentTabs';
import { CourseDetailHero } from './CourseDetailHero';
import { CourseIncludesList } from './CourseIncludesList';
import { CourseInstructors } from './CourseInstructors';
import { CourseLearnList } from './CourseLearnList';
import { CoursePreviewModal } from './CoursePreviewModal';
import { CourseTextSections } from './CourseTextSections';
import { CourseTypeScheduleCard } from './CourseTypeScheduleCard';
import { BUY_BAR_SPACE, CourseBuyBar } from './enrollment/CourseBuyBar';
import { CourseEnrollmentCard } from './enrollment/CourseEnrollmentCard';
import { CourseAudienceSection } from './extras/CourseAudienceSection';
import { CourseBenefitsSection } from './extras/CourseBenefitsSection';
import { CourseFaqSection } from './extras/CourseFaqSection';
import { CourseProjectsSection } from './extras/CourseProjectsSection';
import { CourseSuccessStories } from './extras/CourseSuccessStories';
import { CourseToolsSection } from './extras/CourseToolsSection';

import type { Course, CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseDetailContentProps {
  course: Course;
}

const ENROLMENT_CARD_ID = 'course-enrollment-card';

/**
 * The loaded course page: hero, details on the left (with the tools, what you get, curriculum, projects,
 * audience, success stories and FAQ sections), enrolment card on the right (first on phones), buy bar.
 */
export const CourseDetailContent: FC<CourseDetailContentProps> = ({ course }) => {
  const weeks = useLiveClasses(course._id).data ?? [];
  const quizSections = usePublicQuizSections(course._id).data ?? [];
  const preview = useModal<CourseLecture>();
  const lectureCount = countLectures(course);
  const sections = courseSections(course);

  return (
    <>
      <CourseDetailHero course={course} />
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 6 }, pb: BUY_BAR_SPACE }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
            <CourseTypeScheduleCard course={course} />
            <CourseLearnList items={course.whatYouWillLearn} />
            <CourseIncludesList lectureCount={lectureCount} liveClassPlanCount={weeks.length} />
            <CourseToolsSection section={course.toolsSection} />
            <CourseBenefitsSection section={course.benefitsSection} />
            <Divider sx={{ mb: 4 }} />
            <CourseContentTabs
              courseId={course._id}
              sections={sections}
              weeks={weeks}
              quizSections={quizSections}
              onPreview={preview.openModal}
            />
            <CourseProjectsSection projects={course.projects} />
            <CourseAudienceSection items={course.audience} />
            <CourseTextSections
              requirements={course.requirements}
              description={course.description}
            />
            <Divider sx={{ mb: 4 }} />
            <CourseInstructors teachers={course.teachers} />
            <CourseSuccessStories stories={course.successStories} />
            <CourseFaqSection faqs={course.faqs} />
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            component="aside"
            id={ENROLMENT_CARD_ID}
            tabIndex={-1}
            sx={{ order: { xs: 1, md: 2 }, mt: { md: -32 }, zIndex: 1, outline: 'none' }}
          >
            <CourseEnrollmentCard course={course} lectureCount={lectureCount} />
          </Grid>
        </Grid>
      </Container>
      <CourseBuyBar course={course} targetId={ENROLMENT_CARD_ID} />
      <CoursePreviewModal
        open={preview.open}
        lecture={preview.data}
        lectures={previewLectures(course)}
        courseTitle={course.title}
        onSelect={preview.openModal}
        onClose={preview.closeModal}
      />
    </>
  );
};
