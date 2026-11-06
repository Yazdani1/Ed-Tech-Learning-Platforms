'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ToolLogo } from '@/components/setup/tools/ToolLogo';

import { SOFT_BORDER } from '../detail-styles';

import { DetailSection } from './DetailSection';
import { TopBarCard } from './TopBarCard';

import type { ToolsSection } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseToolsSectionProps {
  section: ToolsSection;
}

const LOGO_SIZE = 40;
/** Space between the cards (theme spacing units) */
const GAP = 2;
const GAP_PX = 16;
/** Four cards per row (two on phones), the last row centred under the others */
const ROW_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: GAP,
  maxWidth: 920,
  mx: 'auto',
  p: 0,
  m: 0,
  listStyle: 'none',
} as const;
const CARD_WIDTH = {
  xs: `calc((100% - ${String(GAP_PX)}px) / 2)`,
  sm: `calc((100% - ${String(GAP_PX * 3)}px) / 4)`,
} as const;
const LOGO_TILE_SX = {
  width: 64,
  height: 64,
  mx: 'auto',
  display: 'grid',
  placeItems: 'center',
  bgcolor: 'common.white',
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: '14px',
  boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
} as const;

/** The tools taught in the course: four cards per row in the middle (colour bar, logo tile, name under it). */
export const CourseToolsSection: FC<CourseToolsSectionProps> = ({ section }) => {
  const { t } = useTranslation();
  if (section.tools.length === 0) return null;
  return (
    <DetailSection
      id="course-tools"
      title={section.title || t('browse.extras.toolsTitle')}
      description={section.description}
      plain
    >
      <Box component="ul" sx={ROW_SX}>
        {section.tools.map((tool, index) => (
          <TopBarCard
            key={tool._id}
            index={index}
            width={CARD_WIDTH}
            elevated
            sx={{ pt: 3.5, pb: 2.5, px: 1, textAlign: 'center' }}
          >
            <Box sx={LOGO_TILE_SX}>
              <ToolLogo tool={tool} size={LOGO_SIZE} decorative />
            </Box>
            <Typography sx={{ mt: 1.5, fontWeight: 500, overflowWrap: 'anywhere' }}>
              {tool.name}
            </Typography>
          </TopBarCard>
        ))}
      </Box>
    </DetailSection>
  );
};
