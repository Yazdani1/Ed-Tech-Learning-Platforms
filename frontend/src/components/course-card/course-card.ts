import type { PriceableCourse } from '@/utils/price';

/** What a course card needs: the fields every course list (catalog, home, My Courses) has. */
export interface CardCourse extends PriceableCourse {
  _id: string;
  title: string;
  coverImage?: string | null;
  category?: { name: string } | null;
  /** A deleted teacher may come back as null */
  teachers: readonly ({ name: string } | null)[];
}

/** Colour of everything "subscription" (badges, the plan section; same purple as the old client). */
export const SUBSCRIPTION_COLOR = '#7c3aed';
