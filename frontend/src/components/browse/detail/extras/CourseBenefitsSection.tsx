'use client';

import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CloudImage } from '@/components/common/CloudImage';

import { ICON_TILE_SX, pickByIndex, TILE_COLORS } from '../detail-styles';

import { DetailSection, gridSx } from './DetailSection';
import { TopBarCard } from './TopBarCard';

import type { BenefitsSection } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseBenefitsSectionProps {
  section: BenefitsSection;
}

const ICON_SIZE = 32;
const ICON_SX = { fontSize: ICON_SIZE } as const;
/** Shown, in turn, for items without an uploaded logo */
const DEFAULT_ICONS = [
  <SupportAgentIcon key="support" sx={ICON_SX} aria-hidden />,
  <WorkspacePremiumIcon key="certificate" sx={ICON_SX} aria-hidden />,
  <WorkOutlineIcon key="work" sx={ICON_SX} aria-hidden />,
] as const;

/** "What will you get from this course": cards with a colour bar, an icon tile, a title and a description. */
export const CourseBenefitsSection: FC<CourseBenefitsSectionProps> = ({ section }) => {
  const { t } = useTranslation();
  if (section.items.length === 0) return null;
  return (
    <DetailSection
      id="course-benefits"
      title={section.title || t('browse.extras.benefitsTitle')}
      description={section.description}
    >
      <Box component="ul" sx={gridSx(2, 3)}>
        {section.items.map((item, index) => {
          const colors = pickByIndex(TILE_COLORS, index);
          return (
            <TopBarCard
              key={`${item.title}-${index}`}
              index={index}
              sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Box sx={{ ...ICON_TILE_SX, bgcolor: colors.bg, color: colors.fg }}>
                {item.icon ? (
                  <CloudImage
                    url={item.icon.url}
                    alt=""
                    sizes={`${ICON_SIZE}px`}
                    fit="contain"
                    sx={{ width: ICON_SIZE, height: ICON_SIZE }}
                  />
                ) : (
                  pickByIndex(DEFAULT_ICONS, index)
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="h3"
                  sx={{ fontWeight: 600, fontSize: '1.1rem', overflowWrap: 'anywhere' }}
                >
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line', mt: 0.25 }}>
                    {item.description}
                  </Typography>
                )}
              </Box>
            </TopBarCard>
          );
        })}
      </Box>
    </DetailSection>
  );
};
