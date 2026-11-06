'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { SideDrawer } from '@/components/common/SideDrawer';
import { StudentCell } from '@/components/enrollments/StudentCell';
import { DetailItem } from '@/components/people/common/DetailItem';
import { StudentDetailSection } from '@/components/people/students/StudentDetailSection';
import { formatDateTime } from '@/utils/dateTime';

import { orNone } from './order-format';
import { ORDER_GRID_SX, OrderPaymentDetails } from './OrderPaymentDetails';

import type { Order } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface OrderDetailsDrawerProps {
  order: Order | undefined;
  open: boolean;
  onClose: () => void;
}

/** Right-side panel with every detail of one purchase: student, course, prices, coupon, payment and dates. */
export const OrderDetailsDrawer: FC<OrderDetailsDrawerProps> = ({ order, open, onClose }) => {
  const { t, i18n } = useTranslation();
  const r = (key: string): string => t(`revenue.details.${key}`);
  return (
    <SideDrawer open={open} onClose={onClose} title={r('title')} hideActions>
      {order && (
        <>
          <StudentDetailSection title={r('student')}>
            <Box sx={{ mb: 1.5 }}>
              <StudentCell student={order.student} />
            </Box>
            <Box sx={ORDER_GRID_SX}>
              <DetailItem label={r('studentNumber')} value={orNone(order.student?.studentNumber)} />
              <DetailItem label={r('email')} value={orNone(order.student?.email)} />
              <DetailItem label={r('phone')} value={orNone(order.student?.phone)} />
            </Box>
          </StudentDetailSection>
          <StudentDetailSection title={r('course')}>
            <Box sx={ORDER_GRID_SX}>
              <DetailItem
                label={r('courseTitle')}
                value={order.course?.title ?? t('revenue.deletedCourse')}
              />
              <DetailItem label={r('batch')} value={orNone(order.course?.batchNumber)} />
            </Box>
          </StudentDetailSection>
          <StudentDetailSection title={r('payment')}>
            <OrderPaymentDetails order={order} />
          </StudentDetailSection>
          <StudentDetailSection title={r('order')}>
            <Box sx={ORDER_GRID_SX}>
              <DetailItem
                label={r('date')}
                value={formatDateTime(order.createdAt, i18n.language)}
              />
              <DetailItem label={r('orderId')} value={order._id} />
            </Box>
          </StudentDetailSection>
        </>
      )}
    </SideDrawer>
  );
};
