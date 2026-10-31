'use client';

import { AnnouncementsTab } from './announcements/AnnouncementsTab';
import { LiveClassTab } from './live/LiveClassTab';
import { StudyMaterialsTab } from './materials/StudyMaterialsTab';
import { CourseOverviewTab } from './overview/CourseOverviewTab';
import { TeachersTab } from './overview/TeachersTab';
import { QaSection } from './qa/QaSection';
import { QuizTab } from './quiz/QuizTab';
import { StudentsTab } from './students/StudentsTab';
import { VideoLecturesTab } from './video/VideoLecturesTab';

import type { LearnTab } from './learn-tabs';
import type { Course, CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LearnTabContentProps {
  tab: LearnTab;
  course: Course;
  activeLecture: CourseLecture | null;
  onSelectLecture: (lectureId: string) => void;
}

/** The open section of the player. */
export const LearnTabContent: FC<LearnTabContentProps> = ({
  tab,
  course,
  activeLecture,
  onSelectLecture,
}) => {
  const courseId = course._id;
  switch (tab) {
    case 'overview':
      return <CourseOverviewTab course={course} />;
    case 'live':
      return <LiveClassTab courseId={courseId} />;
    case 'teacher':
      return <TeachersTab course={course} />;
    case 'announcements':
      return <AnnouncementsTab courseId={courseId} />;
    case 'materials':
      return <StudyMaterialsTab courseId={courseId} />;
    case 'students':
      return <StudentsTab courseId={courseId} courseTitle={course.title} />;
    case 'qa':
      return <QaSection courseId={courseId} />;
    case 'quiz':
      return <QuizTab courseId={courseId} />;
    case 'lectures':
      return (
        <VideoLecturesTab
          course={course}
          activeLecture={activeLecture}
          onSelectLecture={onSelectLecture}
        />
      );
  }
};
