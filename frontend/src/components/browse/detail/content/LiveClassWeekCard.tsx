'use client';

import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SafeHtml } from '@/components/common/SafeHtml';

import { LiveClassItem } from './LiveClassItem';
import { WeekTile } from './WeekTile';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassWeekCardProps {
  week: LiveClassWeek;
  index: number;
  expanded: boolean;
  onToggle: (open: boolean) => void;
}

const CARD_SX = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px !important',
  overflow: 'hidden',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
  '&::before': { display: 'none' },
} as const;
const SUMMARY_SX = {
  px: { xs: 1.5, sm: 2.5 },
  py: 1,
  '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5, minWidth: 0 },
} as const;

/** One week of the live-class plan: number tile, title, description and its classes with day and time. */
export const LiveClassWeekCard: FC<LiveClassWeekCardProps> = ({
  week,
  index,
  expanded,
  onToggle,
}) => {
  const { t } = useTranslation();
  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, open) => {
        onToggle(open);
      }}
      elevation={0}
      disableGutters
      sx={CARD_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={SUMMARY_SX}>
        <WeekTile index={index} />
        <Typography
          component="span"
          sx={{ fontWeight: 800, flex: 1, minWidth: 0, wordBreak: 'break-word' }}
        >
          {week.title ?? week.weekName}
        </Typography>
        <Chip
          icon={<EventIcon sx={{ fontSize: 17 }} />}
          label={t('browse.content.liveClassCount', { count: week.lectures.length })}
          size="small"
          sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 800, mr: 1 }}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {week.description && (
          <SafeHtml
            html={week.description}
            sx={{ px: 2.5, py: 1.5, fontSize: '0.9rem', lineHeight: 1.7, color: 'text.secondary' }}
          />
        )}
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {week.lectures.map((lecture, lectureIndex) => (
            <LiveClassItem key={lecture._id ?? lectureIndex} lecture={lecture} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
