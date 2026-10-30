import type { Course } from '@/schemas/browse.schema';
import type { Subscription, SubscriptionPlan } from '@/schemas/catalog.schema';

export interface SubscriptionState {
  /** The course can be taken through a subscription plan */
  courseInSubscription: boolean;
  /** The viewer's running subscription includes this course */
  coversCourse: boolean;
  /** The viewer (a Student) has a running subscription, but its plan does not include this course */
  needsUpgrade: boolean;
  /** Cheapest monthly price of the plans that include the course, or null */
  lowestPrice: number | null;
  /** Number of courses per plan name */
  planCourseCounts: Record<string, number>;
  /** The viewer's running subscription (plan and end date), or null */
  active: { plan: string; endDate: string } | null;
}

/** What the enrolment card shows about subscriptions (the server decides the real enrolment type). */
export const getSubscriptionState = (
  course: Course,
  plans: readonly SubscriptionPlan[],
  mySubscription: Pick<Subscription, 'plan' | 'endDate'> | null | undefined,
  now: number = Date.now(),
): SubscriptionState => {
  const allowed = course.allowedSubscriptionPlans;
  const courseInSubscription = course.includedInSubscription && allowed.length > 0;
  const active =
    mySubscription && new Date(mySubscription.endDate).getTime() > now ? mySubscription : null;
  const coversCourse = courseInSubscription && active !== null && allowed.includes(active.plan);
  const prices = plans.filter((plan) => allowed.includes(plan.plan)).map((plan) => plan.price);
  return {
    courseInSubscription,
    coversCourse,
    needsUpgrade: courseInSubscription && active !== null && !coversCourse,
    lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
    planCourseCounts: Object.fromEntries(plans.map((plan) => [plan.plan, plan.courseCount])),
    active: active ? { plan: active.plan, endDate: active.endDate } : null,
  };
};
