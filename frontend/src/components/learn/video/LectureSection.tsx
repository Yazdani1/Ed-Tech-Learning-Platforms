'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { LectureListItem } from './LectureListItem';

import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LectureSectionProps {
  section: CourseSection;
  defaultExpanded: boolean;
  activeLectureId: string | undefined;
  onSelect: (lectureId: string) => void;
}

/** One curriculum section as an accordion: title, lecture count and its lectures. */
export const LectureSection: FC<LectureSectionProps> = ({
  section,
  defaultExpanded,
  activeLectureId,
  onSelect,
}) => {
  const { t } = useTranslation();
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      elevation={0}
      disableGutters
      sx={{
        bgcolor: 'transparent',
        borderBottom: 1,
        borderColor: 'divider',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ px: 2, bgcolor: 'grey.100', minHeight: 48 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{section.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t('learn.video.lectureCount', { count: section.lectures.length })}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {section.lectures.length === 0 ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', px: 2, py: 1.5 }}
          >
            {t('learn.video.noLectures')}
          </Typography>
        ) : (
          <List disablePadding>
            {section.lectures.map((lecture: CourseLecture) => (
              <LectureListItem
                key={lecture._id}
                lecture={lecture}
                active={activeLectureId === lecture._id}
                onSelect={onSelect}
              />
            ))}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
