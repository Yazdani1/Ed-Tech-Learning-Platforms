import { fromLocalInput, toDateInput } from '@/utils/dateTime';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { Course } from '@/schemas/browse.schema';

// Form values <-> the multipart body of POST/PUT /api/courses (lists travel as JSON strings).

const priceText = (value: number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value);

/** The editor form filled from a saved course. */
export const toFormValues = (course: Course): CourseDetailsForm => {
  const isPaid = course.pricing === 'Paid';
  return {
    title: course.title,
    subtitle: course.subtitle ?? '',
    category: course.category?._id ?? '',
    courseType: course.courseType?._id ?? '',
    startDate: toDateInput(course.startDate),
    endDate: toDateInput(course.endDate),
    teachers: course.teachers.flatMap((teacher) => (teacher ? [teacher._id] : [])),
    visibility: course.visibility,
    pricing: course.pricing,
    listPrice: isPaid ? priceText(course.listPrice ?? course.price) : '',
    discountPrice: isPaid ? priceText(course.discountPrice ?? course.price) : '',
    includedInSubscription: course.includedInSubscription,
    allowedSubscriptionPlans: course.allowedSubscriptionPlans,
    description: course.description,
    whatYouWillLearn: course.whatYouWillLearn,
    whatYouWillGet: course.whatYouWillGet,
    requirements: course.requirements,
  };
};

const cleanList = (items: string[]): string[] =>
  items.map((item) => item.trim()).filter((item) => item !== '');

const appendContent = (body: FormData, values: CourseDetailsForm): void => {
  body.append('description', values.description);
  body.append('whatYouWillLearn', JSON.stringify(cleanList(values.whatYouWillLearn)));
  body.append('whatYouWillGet', JSON.stringify(cleanList(values.whatYouWillGet)));
  body.append('requirements', JSON.stringify(cleanList(values.requirements)));
};

interface DetailsOptions {
  /** Picked cover image to upload with this save */
  cover: File | null;
  /** Used when the title is left empty ("Untitled Course", as before) */
  fallbackTitle: string;
  /** Update only: also send the description and the lists (the create route ignores them) */
  withContent: boolean;
}

/** The course details as multipart form data. Prices are only sent for Paid (the server recomputes them). */
export const buildDetailsFormData = (
  values: CourseDetailsForm,
  { cover, fallbackTitle, withContent }: DetailsOptions,
): FormData => {
  const body = new FormData();
  body.append('title', values.title.trim() || fallbackTitle);
  body.append('subtitle', values.subtitle.trim());
  if (values.category) body.append('category', values.category);
  if (values.courseType) body.append('courseType', values.courseType);
  body.append('startDate', fromLocalInput(values.startDate) ?? '');
  body.append('endDate', fromLocalInput(values.endDate) ?? '');
  body.append('visibility', values.visibility);
  body.append('pricing', values.pricing);
  if (values.pricing === 'Paid') {
    const finalPrice = values.discountPrice || values.listPrice;
    body.append('listPrice', values.listPrice);
    body.append('discountPrice', finalPrice);
    body.append('price', finalPrice);
  }
  body.append('includedInSubscription', String(values.includedInSubscription));
  body.append('teachers', JSON.stringify(values.teachers));
  body.append('allowedSubscriptionPlans', JSON.stringify(values.allowedSubscriptionPlans));
  if (withContent) appendContent(body, values);
  if (cover) body.append('coverImage', cover);
  return body;
};

/** After creating: the description and lists in a follow-up update, or null when there are none. */
export const buildContentFormData = (values: CourseDetailsForm): FormData | null => {
  const hasContent =
    values.description.trim() !== '' ||
    [values.whatYouWillLearn, values.whatYouWillGet, values.requirements].some(
      (list) => cleanList(list).length > 0,
    );
  if (!hasContent) return null;
  const body = new FormData();
  appendContent(body, values);
  return body;
};

/** Percentage saved by the discount price, 0 when there is no discount. */
export const discountPercent = (listPrice: string, discountPrice: string): number => {
  const list = Number(listPrice);
  const discount = Number(discountPrice);
  if (!(list > 0) || discountPrice === '' || !(discount >= 0) || discount >= list) return 0;
  const PERCENT = 100;
  return Math.round(((list - discount) / list) * PERCENT);
};
