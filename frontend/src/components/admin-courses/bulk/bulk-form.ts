import { fromLocalInput } from '@/utils/dateTime';
import { hasVisibleText } from '@/utils/html-text';

import type {
  BulkCourseUpdates,
  BulkDiscountRequest,
  BulkUpdateRequest,
  CourseStatus,
  CourseVisibility,
} from '@/schemas/admin-courses.schema';

// Bulk edit form state and the pure rules that turn it into a request (kept out of the components so they
// are easy to test). Error results are i18n keys under adminCourses.bulk.errors.

export type BulkTab = 'fields' | 'discount' | 'announcement';
export const BULK_TABS: readonly BulkTab[] = ['fields', 'discount', 'announcement'];

/** Course type value meaning "remove the course type from every selected course". */
export const CLEAR_COURSE_TYPE = '__clear__';

export interface BulkFieldsState {
  courseType: string;
  category: string;
  status: '' | CourseStatus;
  visibility: '' | CourseVisibility;
  pricing: '' | 'Free' | 'Paid';
  price: string;
  subscriptionIncluded: boolean;
  subscriptionPlans: string[];
  /** True once the admin touched the subscription switch or plans (otherwise they are not sent) */
  subscriptionEdited: boolean;
  teacherIds: string[];
  startDate: string;
  endDate: string;
}

export interface BulkDiscountState {
  discountPercent: string;
  /** datetime-local value in the viewer's time zone */
  discountEndsAt: string;
}

export interface BulkAnnouncementState {
  title: string;
  description: string;
}

export const emptyFields = (): BulkFieldsState => ({
  courseType: '',
  category: '',
  status: '',
  visibility: '',
  pricing: '',
  price: '',
  subscriptionIncluded: false,
  subscriptionPlans: [],
  subscriptionEdited: false,
  teacherIds: [],
  startDate: '',
  endDate: '',
});

export const emptyDiscount = (): BulkDiscountState => ({ discountPercent: '', discountEndsAt: '' });
export const emptyAnnouncement = (): BulkAnnouncementState => ({ title: '', description: '' });

export type BuildResult<T> = { ok: true; body: T } | { ok: false; error: string };

const MIN_PERCENT = 1;
const MAX_PERCENT = 99;

export const buildDiscountRequest = (
  courseIds: string[],
  form: BulkDiscountState,
  now: number = Date.now(),
): BuildResult<BulkDiscountRequest> => {
  const percent = Number(form.discountPercent);
  if (
    form.discountPercent.trim() === '' ||
    !Number.isInteger(percent) ||
    percent < MIN_PERCENT ||
    percent > MAX_PERCENT
  )
    return { ok: false, error: 'percent' };
  const endsAt = fromLocalInput(form.discountEndsAt);
  if (!endsAt || new Date(endsAt).getTime() <= now) return { ok: false, error: 'endsAt' };
  return { ok: true, body: { courseIds, discountPercent: percent, discountEndsAt: endsAt } };
};

/** Only the fields the admin filled in; 'price' when a Paid price is missing or invalid. */
const buildUpdates = (form: BulkFieldsState): BulkCourseUpdates | 'price' => {
  const updates: BulkCourseUpdates = {};
  if (form.courseType !== '')
    updates.courseType = form.courseType === CLEAR_COURSE_TYPE ? null : form.courseType;
  if (form.category !== '') updates.category = form.category;
  if (form.status !== '') updates.status = form.status;
  if (form.visibility !== '') updates.visibility = form.visibility;
  if (form.pricing === 'Paid') {
    const price = Number(form.price);
    if (form.price.trim() === '' || !Number.isFinite(price) || price <= 0) return 'price';
    updates.pricing = 'Paid';
    updates.price = price;
  } else if (form.pricing === 'Free') {
    updates.pricing = 'Free';
    updates.price = null;
  }
  if (form.subscriptionEdited) {
    updates.includedInSubscription = form.subscriptionIncluded;
    updates.allowedSubscriptionPlans = form.subscriptionIncluded ? form.subscriptionPlans : [];
  }
  if (form.teacherIds.length > 0) updates.teachers = form.teacherIds;
  if (form.startDate !== '') updates.startDate = form.startDate;
  if (form.endDate !== '') updates.endDate = form.endDate;
  return updates;
};

/**
 * Fields tab: the filled fields (plus an announcement if one was written). Announcement tab: the
 * announcement is required (filled fields from the first tab still go with it, as in the old client).
 */
export const buildUpdateRequest = (
  courseIds: string[],
  fields: BulkFieldsState,
  announcement: BulkAnnouncementState,
  tab: BulkTab,
): BuildResult<BulkUpdateRequest> => {
  const updates = buildUpdates(fields);
  if (updates === 'price') return { ok: false, error: 'price' };
  const hasUpdates = Object.keys(updates).length > 0;
  const title = announcement.title.trim();
  // Rich text from the editor ('' when empty), shown through SafeHtml in the course player
  const { description } = announcement;
  const hasAnnouncement = title !== '' && hasVisibleText(description);
  if (tab === 'announcement' && !hasAnnouncement) return { ok: false, error: 'announcement' };
  if (!hasUpdates && !hasAnnouncement) return { ok: false, error: 'nothing' };
  return {
    ok: true,
    body: {
      courseIds,
      ...(hasUpdates && { updates }),
      ...(hasAnnouncement && { announcement: { title, description } }),
    },
  };
};

/** Two columns from 600 px, one on phones (bulk form layout). */
export const BULK_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 2,
} as const;
export const BULK_INPUT_SX = { '& .MuiInputBase-root': { minHeight: 44 } } as const;

/** Sets one field of the "Update Fields" tab. */
export type SetBulkField = <K extends keyof BulkFieldsState>(
  key: K,
  value: BulkFieldsState[K],
) => void;
