import { describe, expect, it } from 'vitest';

import {
  countLectures,
  findIntroVideoId,
  formatLectureDuration,
  previewLectures,
  splitDuration,
  youTubeId,
} from '../course-utils';
import { getSubscriptionState } from '../detail/enrollment/subscription-state';
import { groupFreeCourses, UNTYPED_GROUP_ID } from '../free/group-free-courses';

import { COURSE_TYPE, makeCourse, PLANS } from './browse-fixtures';

const NOW = Date.parse('2026-10-30T12:00:00Z');
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('durations and videos', () => {
  it('formats lecture lengths', () => {
    expect(formatLectureDuration(65)).toBe('1:05');
    expect(formatLectureDuration(3725)).toBe('1:02:05');
    expect(formatLectureDuration(0)).toBe('');
    expect(splitDuration(5400)).toEqual({ hours: 1, minutes: 30 });
  });

  it('reads YouTube ids and rejects other addresses', () => {
    expect(youTubeId(YT)).toBe('dQw4w9WgXcQ');
    expect(youTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeId('https://vimeo.com/123')).toBeNull();
    expect(youTubeId(null)).toBeNull();
  });

  it('picks the "course introduction" lecture, otherwise the first free preview', () => {
    const sections = [
      {
        _id: 's1',
        title: 'Start',
        lectures: [
          {
            _id: 'l1',
            title: 'Welcome',
            isPreview: true,
            videoUrl: 'https://youtu.be/aaaaaaaaaaa',
          },
          { _id: 'l2', title: 'Course Introduction', isPreview: true, videoUrl: YT },
          { _id: 'l3', title: 'Locked', isPreview: false },
        ],
      },
    ];
    const course = makeCourse({ sections });
    expect(findIntroVideoId(course)).toBe('dQw4w9WgXcQ');
    expect(previewLectures(course).map((lecture) => lecture._id)).toEqual(['l1', 'l2']);
    expect(countLectures(course)).toBe(3);
    expect(findIntroVideoId(makeCourse())).toBeNull();
  });
});

describe('groupFreeCourses', () => {
  it('groups by course type in type order and puts untyped courses last', () => {
    const typed = makeCourse({ title: 'Typed' });
    const untyped = makeCourse({ title: 'Untyped', courseType: null });
    const groups = groupFreeCourses([untyped, typed], [COURSE_TYPE]);
    expect(groups.map((group) => group.id)).toEqual([COURSE_TYPE._id, UNTYPED_GROUP_ID]);
    expect(groups[1]?.name).toBeNull();
  });
});

describe('getSubscriptionState', () => {
  const course = makeCourse({
    pricing: 'Paid',
    listPrice: 500,
    includedInSubscription: true,
    allowedSubscriptionPlans: ['Premium'],
  });

  it('a running plan that includes the course covers it', () => {
    const state = getSubscriptionState(
      course,
      PLANS,
      { plan: 'Premium', endDate: '2027-01-01T00:00:00Z' },
      NOW,
    );
    expect(state).toMatchObject({
      courseInSubscription: true,
      coversCourse: true,
      needsUpgrade: false,
      lowestPrice: 600,
    });
  });

  it('a running plan that does not include it needs an upgrade', () => {
    const state = getSubscriptionState(
      course,
      PLANS,
      { plan: 'Basic', endDate: '2027-01-01T00:00:00Z' },
      NOW,
    );
    expect(state).toMatchObject({ coversCourse: false, needsUpgrade: true });
  });

  it('an expired plan counts as none', () => {
    const state = getSubscriptionState(
      course,
      PLANS,
      { plan: 'Premium', endDate: '2026-01-01T00:00:00Z' },
      NOW,
    );
    expect(state).toMatchObject({ active: null, coversCourse: false, needsUpgrade: false });
  });
});
