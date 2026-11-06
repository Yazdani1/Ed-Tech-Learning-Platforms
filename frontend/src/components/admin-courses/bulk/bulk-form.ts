import type {
  BulkCourseUpdates,
  BulkUpdateRequest,
  CourseStatus,
  CourseVisibility,
} from '@/schemas/admin-courses.schema';

// Bulk edit form state and the pure rule that turns it into a request (kept out of the components so it is
// easy to test). Error results are i18n keys under adminCourses.bulk.errors.

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

export type BuildResult<T> = { ok: true; body: T } | { ok: false; error: string };

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

/** The filled fields of the bulk form ('nothing' when none was filled in). */
export const buildUpdateRequest = (
  courseIds: string[],
  fields: BulkFieldsState,
): BuildResult<BulkUpdateRequest> => {
  const updates = buildUpdates(fields);
  if (updates === 'price') return { ok: false, error: 'price' };
  if (Object.keys(updates).length === 0) return { ok: false, error: 'nothing' };
  return { ok: true, body: { courseIds, updates } };
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
