'use client';

import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { DateRangeFields } from '@/components/common/DateRangeFields';
import { InlineSelect } from '@/components/common/InlineSelect';
import {
  STUDENT_ENROLMENT_FILTERS,
  STUDENT_PHONE_FILTERS,
  STUDENT_SORTS,
  STUDENT_STATUS_FILTERS,
} from '@/schemas/students.schema';

import type { StudentParams } from './useStudentParams';
import type { FC } from 'react';

interface StudentFilterFieldsProps {
  params: StudentParams;
  onChange: (changes: Partial<Record<keyof StudentParams, string>>) => void;
  activeFilters: number;
}

const TOUCH_TARGET = 44;
const SELECTS = [
  ['enrollment', STUDENT_ENROLMENT_FILTERS],
  ['status', STUDENT_STATUS_FILTERS],
  ['phone', STUDENT_PHONE_FILTERS],
  ['sort', STUDENT_SORTS],
] as const;
/** The value each dropdown has when it is not set (left out of the address) */
const DEFAULTS: Record<string, string> = {
  enrollment: 'any',
  status: 'any',
  phone: 'any',
  sort: 'newest',
};
const CLEARED = {
  courses: '',
  enrollment: '',
  status: '',
  phone: '',
  joinedFrom: '',
  joinedTo: '',
};

/** Enrolment type, status, phone, joined between, sort order and "Clear filters" of the students page. */
export const StudentFilterFields: FC<StudentFilterFieldsProps> = ({
  params,
  onChange,
  activeFilters,
}) => {
  const { t } = useTranslation();
  const s = (key: string): string => t(`people.students.filters.${key}`);
  const choose = (key: string, value: string) => {
    onChange({ [key]: value === DEFAULTS[key] ? '' : value });
  };
  return (
    <>
      {SELECTS.map(([key, options]) => (
        <InlineSelect
          key={key}
          label={s(key)}
          value={params[key]}
          options={options.map((option) => ({
            value: option,
            label: s(`${key}Options.${option}`),
          }))}
          onChange={(value) => {
            choose(key, value);
          }}
        />
      ))}
      <DateRangeFields
        from={params.joinedFrom}
        to={params.joinedTo}
        fromLabel={s('joinedFrom')}
        toLabel={s('joinedTo')}
        onChange={({ from, to }) => {
          onChange({
            ...(from !== undefined && { joinedFrom: from }),
            ...(to !== undefined && { joinedTo: to }),
          });
        }}
      />
      {activeFilters > 0 && (
        <Button
          onClick={() => {
            onChange(CLEARED);
          }}
          sx={{ minHeight: TOUCH_TARGET }}
        >
          {s('clear')}
        </Button>
      )}
    </>
  );
};
