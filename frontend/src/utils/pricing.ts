import type { ICourse } from '../types/index';

export const formatBdt = (value?: number | null) =>
	value == null ? '' : `৳${value.toLocaleString()}`;

export const getCoursePriceInfo = (course: Pick<ICourse, 'pricing' | 'price' | 'listPrice' | 'discountPrice'>) => {
	if (course.pricing === 'Free') {
		return {
			isFree: true,
			listPrice: 0,
			discountPrice: 0,
			discountAmount: 0,
			discountPercent: 0,
			hasDiscount: false,
		};
	}

	const listPrice = Math.max(course.listPrice ?? course.price ?? 0, 0);
	const discountPrice = Math.max(course.discountPrice ?? course.price ?? listPrice, 0);
	const discountAmount = Math.max(listPrice - discountPrice, 0);
	const discountPercent = listPrice > 0 ? Math.round((discountAmount / listPrice) * 100) : 0;

	return {
		isFree: false,
		listPrice,
		discountPrice,
		discountAmount,
		discountPercent,
		hasDiscount: discountAmount > 0,
	};
};
