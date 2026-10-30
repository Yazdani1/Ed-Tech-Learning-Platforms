'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { sectionSeconds, splitDuration } from '../../course-utils';

import { LectureRow } from './LectureRow';

import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';
import type { TFunction } from 'i18next';
import type { FC } from 'react';

interface SectionAccordionProps {
  section: CourseSection;
  expanded: boolean;
  last: boolean;
  onToggle: (open: boolean) => void;
  onPreview: (lecture: CourseLecture) => void;
}

const durationLabel = (t: TFunction, seconds: number): string => {
  if (seconds <= 0) return '';
  const { hours, minutes } = splitDuration(seconds);
  if (hours > 0 && minutes > 0) return t('browse.content.durationHoursMinutes', { hours, minutes });
  if (hours > 0) return t('browse.content.durationHours', { hours });
  return t('browse.content.durationMinutes', { minutes });
};

const SUMMARY_SX = {
  bgcolor: 'grey.50',
  px: { xs: 2, sm: 2.5 },
  minHeight: 56,
  '& .MuiAccordionSummary-content': { flexWrap: 'wrap', gap: 0.5, alignItems: 'center' },
} as const;

/** One section of the outline: title, lecture count and length; opens to its lectures. */
export const SectionAccordion: FC<SectionAccordionProps> = ({
  section,
  expanded,
  last,
  onToggle,
  onPreview,
}) => {
  const { t } = useTranslation();
  const duration = durationLabel(t, sectionSeconds(section));
  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, open) => {
        onToggle(open);
      }}
      elevation={0}
      disableGutters
      sx={{
        borderBottom: last ? 'none' : '1px solid',
        borderColor: 'divider',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={SUMMARY_SX}>
        <Typography component="span" sx={{ fontWeight: 600, flex: 1, minWidth: 160 }}>
          {section.title}
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          {t('browse.content.lectureCount', { count: section.lectures.length })}
          {duration && ` • ${duration}`}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {section.lectures.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 2 }}>
            {t('browse.content.noLectures')}
          </Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {section.lectures.map((lecture, index) => (
              <LectureRow
                key={lecture._id}
                lecture={lecture}
                first={index === 0}
                onPreview={onPreview}
              />
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
