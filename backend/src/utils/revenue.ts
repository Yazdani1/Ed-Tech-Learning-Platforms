// How money is counted in the reports (dashboard, performance, students): the same rules everywhere.

/** Rounded to 2 decimals (money amounts in the responses). */
export const money = (value: number): number => Math.round(value * 100) / 100;

interface RevenueEnrollment {
	enrollmentType: string;
	paidPrice?: number;
	course?: unknown;
}

/** A paid enrolment earns its paidPrice, or the course price when none was saved; free and subscription earn 0. */
export const enrollmentRevenue = (enrollment: RevenueEnrollment): number => {
	if (enrollment.enrollmentType !== 'paid') return 0;
	const course = enrollment.course as { price?: number } | null | undefined;
	return enrollment.paidPrice || course?.price || 0;
};

interface RevenueSubscription {
	plan: string;
	pricePaid?: number;
}

/** A subscription earns its pricePaid, or the plan's configured price when none was saved. */
export const subscriptionRevenue = (subscription: RevenueSubscription, planPrices: Map<string, number>): number =>
	subscription.pricePaid ?? planPrices.get(subscription.plan) ?? 0;
