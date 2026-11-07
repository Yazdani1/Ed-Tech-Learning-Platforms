'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { DateRangeFields } from '@/components/common/DateRangeFields';
import { InlineSelect } from '@/components/common/InlineSelect';
import { SearchField } from '@/components/common/SearchField';
import { ORDER_TYPES, type OrderType } from '@/schemas/revenue.schema';

import {
  activeFilterCount,
  COUPON_FILTERS,
  EMPTY_FILTERS,
  METHOD_FILTERS,
  type CourseOrderFilters,
} from './course-order-filters';

import type { FC } from 'react';

interface CourseOrdersFiltersProps {
  filters: CourseOrderFilters;
  onChange: (changes: Partial<CourseOrderFilters>) => void;
}

/** Search, type, coupon, payment method and a date range (both days included); "Clear" resets them. */
export const CourseOrdersFilters: FC<CourseOrdersFiltersProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();
  const f = (key: string): string => t(`adminCourses.enrollments.filters.${key}`);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Box sx={{ width: { xs: '100%', sm: 260 } }}>
        <SearchField
          value={filters.search}
          onChange={(search) => {
            onChange({ search });
          }}
          label={f('search')}
          placeholder={f('searchPlaceholder')}
        />
      </Box>
      <InlineSelect
        label={t('revenue.columns.type')}
        value={filters.type}
        options={ORDER_TYPES.map((type) => ({ value: type, label: t(`revenue.types.${type}`) }))}
        onChange={(type) => {
          onChange({ type: type as OrderType });
        }}
      />
      <InlineSelect
        label={f('coupon')}
        value={filters.coupon}
        options={COUPON_FILTERS.map((value) => ({ value, label: f(`couponOptions.${value}`) }))}
        onChange={(coupon) => {
          onChange({ coupon: coupon as CourseOrderFilters['coupon'] });
        }}
      />
      <InlineSelect
        label={f('method')}
        value={filters.method}
        options={METHOD_FILTERS.map((value) => ({ value, label: f(`methodOptions.${value}`) }))}
        onChange={(method) => {
          onChange({ method: method as CourseOrderFilters['method'] });
        }}
      />
      <DateRangeFields
        from={filters.from}
        to={filters.to}
        fromLabel={t('revenue.period.from')}
        toLabel={t('revenue.period.to')}
        onChange={onChange}
      />
      {activeFilterCount(filters) > 0 && (
        <Button
          onClick={() => {
            onChange(EMPTY_FILTERS);
          }}
          sx={{ minHeight: 44 }}
        >
          {f('clear')}
        </Button>
      )}
    </Box>
  );
};
