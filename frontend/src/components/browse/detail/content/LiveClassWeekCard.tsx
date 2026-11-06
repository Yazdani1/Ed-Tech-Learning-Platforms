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

import {
  CARD_RADIUS,
  LIGHT_CARD_SHADOW,
  pickByIndex,
  SOFT_BORDER,
  WEEK_COLORS,
} from '../detail-styles';

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
  borderRadius: `${CARD_RADIUS} !important`,
  overflow: 'hidden',
  boxShadow: LIGHT_CARD_SHADOW,
  '&::before': { display: 'none' },
} as const;
const SUMMARY_SX = {
  px: { xs: 2, sm: 3 },
  py: 1.5,
  alignItems: 'flex-start',
  '& .MuiAccordionSummary-content': { alignItems: 'flex-start', gap: 2, minWidth: 0, m: 0 },
  '& .MuiAccordionSummary-expandIconWrapper': { mt: 0.5 },
} as const;
const COUNT_CHIP_SX = {
  display: { xs: 'none', sm: 'inline-flex' },
  flexShrink: 0,
  mr: 1,
  bgcolor: 'common.white',
  border: `1px solid ${SOFT_BORDER}`,
  '& .MuiChip-icon': { color: '#1d4ed8' },
} as const;
const DESCRIPTION_SX = {
  px: { xs: 2, sm: 3 },
  pb: 2,
  lineHeight: 1.7,
  color: '#475569',
  '& p': { m: 0 },
} as const;

/** One week of the live-class plan: gradient number tile, title, description and its classes with day and time. */
export const LiveClassWeekCard: FC<LiveClassWeekCardProps> = ({
  week,
  index,
  expanded,
  onToggle,
}) => {
  const { t } = useTranslation();
  const colors = pickByIndex(WEEK_COLORS, index);
  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, open) => {
        onToggle(open);
      }}
      elevation={0}
      disableGutters
      sx={{ ...CARD_SX, bgcolor: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={SUMMARY_SX}>
        <WeekTile index={index} />
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: '1.2rem',
            lineHeight: 1.35,
            flex: 1,
            minWidth: 0,
            wordBreak: 'break-word',
          }}
        >
          {week.title ?? week.weekName}
        </Typography>
        <Chip
          icon={<EventIcon sx={{ fontSize: 17 }} />}
          label={t('browse.content.liveClassCount', { count: week.lectures.length })}
          sx={COUNT_CHIP_SX}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {week.description && <SafeHtml html={week.description} sx={DESCRIPTION_SX} />}
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {week.lectures.map((lecture, lectureIndex) => (
            <LiveClassItem key={lecture._id ?? lectureIndex} lecture={lecture} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
