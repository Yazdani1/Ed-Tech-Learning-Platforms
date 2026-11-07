'use client';

import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  AXIS_TICK,
  BAR_RADIUS,
  GRID_COLOR,
  formatMoney,
  seriesColor,
} from '@/components/insights/insights.utils';
import { formatBucketLabel } from '@/utils/dateTime';

import type { RevenuePoint, TopCourse } from '@/schemas/revenue.schema';
import type { FC } from 'react';

// The extra Performance charts (loaded on demand with recharts): sales and VAT per month, enrolments per month,
// average order value per month and sales per top course.

const MARGIN = { top: 4, right: 16, left: 0, bottom: 0 };
const MAX_BAR_SIZE = 32;
const TITLE_MAX = 22;

interface MonthlyProps {
  data: readonly RevenuePoint[];
}

const useMonthLabel = (): ((key: string) => string) => {
  const { i18n } = useTranslation();
  return (key) => formatBucketLabel(key, 'month', i18n.language);
};

const moneyTick = (value: number): string => formatMoney(value);

/** Net sales and VAT per month, stacked (together they are the total sales). */
export const SalesVatChart: FC<MonthlyProps> = ({ data }) => {
  const { t } = useTranslation();
  const label = useMonthLabel();
  const rows = data.map((point) => ({ ...point, net: Math.max(point.revenue - point.vat, 0) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={label}
        />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={moneyTick} />
        <Tooltip
          labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)}
          formatter={(value) => formatMoney(Number(value))}
        />
        <Legend />
        <Bar
          dataKey="net"
          stackId="sales"
          name={t('insights.performance.charts.net')}
          fill={seriesColor(0)}
          maxBarSize={MAX_BAR_SIZE}
        />
        <Bar
          dataKey="vat"
          stackId="sales"
          name={t('insights.performance.charts.vat')}
          fill={seriesColor(3)}
          radius={BAR_RADIUS}
          maxBarSize={MAX_BAR_SIZE}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Paid and other (free + subscription) enrolments per month. */
export const EnrolmentTrendChart: FC<MonthlyProps> = ({ data }) => {
  const { t } = useTranslation();
  const label = useMonthLabel();
  const rows = data.map((point) => ({ ...point, other: point.orders - point.paidOrders }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={label}
        />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="paidOrders"
          name={t('insights.performance.charts.paid')}
          stroke={seriesColor(0)}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="other"
          name={t('insights.performance.charts.other')}
          stroke={seriesColor(2)}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/** Average amount paid per paid enrolment, per month. */
export const AverageOrderChart: FC<MonthlyProps> = ({ data }) => {
  const { t } = useTranslation();
  const label = useMonthLabel();
  const rows = data.map((point) => ({
    date: point.date,
    average: point.paidOrders > 0 ? Math.round(point.revenue / point.paidOrders) : 0,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={label}
        />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={moneyTick} />
        <Tooltip
          labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)}
          formatter={(value) => formatMoney(Number(value))}
        />
        <Line
          type="monotone"
          dataKey="average"
          name={t('insights.performance.charts.average')}
          stroke={seriesColor(6)}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

interface TopCoursesBarProps {
  data: readonly TopCourse[];
}

const shortTitle = (title: string): string =>
  title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX)}…` : title;

/** Sales of the 5 best-selling courses, as horizontal bars. */
export const TopCoursesBarChart: FC<TopCoursesBarProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={[...data]} layout="vertical" margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_COLOR} />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={moneyTick}
        />
        <YAxis
          type="category"
          dataKey="title"
          width={130}
          tick={AXIS_TICK}
          tickFormatter={shortTitle}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Bar
          dataKey="revenue"
          name={t('insights.performance.charts.sales')}
          fill={seriesColor(1)}
          radius={[0, 4, 4, 0]}
          maxBarSize={MAX_BAR_SIZE}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
