'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CloudImage } from '@/components/common/CloudImage';

import { DetailSection, gridSx } from './DetailSection';

import type { BenefitsSection } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseBenefitsSectionProps {
  section: BenefitsSection;
}

const ICON_SIZE = 44;

/** "What you get": cards with a logo, a title and a description. */
export const CourseBenefitsSection: FC<CourseBenefitsSectionProps> = ({ section }) => {
  const { t } = useTranslation();
  if (section.items.length === 0) return null;
  return (
    <DetailSection
      id="course-benefits"
      title={section.title || t('browse.extras.benefitsTitle')}
      description={section.description}
    >
      <Box component="ul" sx={gridSx(2)}>
        {section.items.map((item, index) => (
          <Paper
            component="li"
            key={`${item.title}-${index}`}
            variant="outlined"
            sx={{ p: 2, display: 'flex', gap: 1.5, borderRadius: 2 }}
          >
            {item.icon ? (
              <CloudImage
                url={item.icon.url}
                alt=""
                sizes={`${ICON_SIZE}px`}
                fit="contain"
                sx={{ width: ICON_SIZE, height: ICON_SIZE }}
              />
            ) : (
              <CheckCircleOutlineIcon
                color="primary"
                sx={{ fontSize: ICON_SIZE, flexShrink: 0 }}
                aria-hidden
              />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h3" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                {item.title}
              </Typography>
              {item.description && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {item.description}
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </DetailSection>
  );
};
