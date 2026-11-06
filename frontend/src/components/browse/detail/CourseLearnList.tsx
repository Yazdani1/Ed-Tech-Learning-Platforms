'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CARD_RADIUS, SOFT_BORDER } from './detail-styles';
import { DetailSection, gridSx } from './extras/DetailSection';
import { ELEVATED_SHADOW } from './extras/TopBarCard';

import type { FC } from 'react';

interface CourseLearnListProps {
  items: readonly string[];
}

/** Items shown before "Show more" */
export const LEARN_VISIBLE_COUNT = 4;
const LEARN_BAND = '#eef1f5';
const ITEM_SX = {
  p: { xs: 2, sm: 2.5 },
  display: 'flex',
  gap: 1.5,
  alignItems: 'flex-start',
  bgcolor: 'common.white',
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: CARD_RADIUS,
  boxShadow: ELEVATED_SHADOW,
} as const;

/**
 * "What you'll learn" on a grey full-width band: a white card with a green tick per item, two per row from
 * tablet width; the first four, the rest behind "Show more".
 */
export const CourseLearnList: FC<CourseLearnListProps> = ({ items }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const listId = useId();
  if (items.length === 0) return null;
  const hasMore = items.length > LEARN_VISIBLE_COUNT;
  const shown = open ? items : items.slice(0, LEARN_VISIBLE_COUNT);
  return (
    <DetailSection id="course-learn" title={t('browse.detail.whatYouWillLearn')} band={LEARN_BAND}>
      <Box component="ul" id={listId} sx={gridSx(2)}>
        {shown.map((item, index) => (
          <Box component="li" key={`${index}-${item}`} sx={ITEM_SX}>
            <CheckCircleOutlineIcon sx={{ color: '#059669', flexShrink: 0 }} aria-hidden />
            <Typography sx={{ lineHeight: 1.6, minWidth: 0, overflowWrap: 'anywhere' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            aria-expanded={open}
            aria-controls={listId}
            endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => {
              setOpen((value) => !value);
            }}
            sx={{
              minHeight: 44,
              borderRadius: 99,
              px: 3,
              bgcolor: 'common.white',
              fontWeight: 600,
            }}
          >
            {open ? t('browse.detail.showLess') : t('browse.detail.showMore')}
          </Button>
        </Box>
      )}
    </DetailSection>
  );
};
