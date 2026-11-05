import { CoursePaymentView } from '@/components/payment/CoursePaymentView';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Complete payment' };

interface CoursePaymentPageProps {
  params: Promise<{ id: string }>;
}

const CoursePaymentPage = async ({ params }: CoursePaymentPageProps) => {
  const { id } = await params;
  return <CoursePaymentView courseId={id} />;
};

export default CoursePaymentPage;
