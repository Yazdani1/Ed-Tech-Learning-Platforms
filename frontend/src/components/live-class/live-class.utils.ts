import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { LiveClassLectureRequest, LiveClassRequest } from '@/schemas/learn.schema';

/** What the live class form opens with. */
export interface LiveClassFormTarget {
  /** The week being edited; undefined to add a new week */
  week?: LiveClassWeek;
  /** Open with an empty class added at the end ("Add Class" on a week card) */
  addClass?: boolean;
}

/** An empty class row of the form. */
export const blankLecture = (): LiveClassLectureRequest => ({
  title: '',
  day: '',
  time: '',
  description: '',
});

/** Form values of a week (a new week, or "Add Class", gets one empty class at the end). */
export const toLiveClassForm = (target: LiveClassFormTarget | undefined): LiveClassRequest => {
  const week = target?.week;
  const lectures = (week?.lectures ?? []).map((lecture) => ({
    title: lecture.title,
    day: lecture.day,
    time: lecture.time,
    description: lecture.description ?? '',
  }));
  if (lectures.length === 0 || target?.addClass) lectures.push(blankLecture());
  return {
    title: week?.title ?? '',
    weekName: week?.weekName ?? '',
    description: week?.description ?? '',
    lectures,
  };
};

/** The week title, else its week name; undefined when both are empty. */
export const weekTitle = (week: LiveClassWeek): string | undefined =>
  [week.title, week.weekName].find((value): value is string => Boolean(value?.trim()));
