'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ToolLogo } from '@/components/setup/tools/ToolLogo';

import { DetailSection } from './DetailSection';

import type { ToolsSection } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseToolsSectionProps {
  section: ToolsSection;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(4, minmax(0, 1fr))',
    md: 'repeat(5, minmax(0, 1fr))',
  },
  gap: 1.5,
  p: 0,
  m: 0,
  listStyle: 'none',
} as const;

/** The tools taught in the course: a grid of logo cards with the name under each logo. */
export const CourseToolsSection: FC<CourseToolsSectionProps> = ({ section }) => {
  const { t } = useTranslation();
  if (section.tools.length === 0) return null;
  return (
    <DetailSection
      id="course-tools"
      title={section.title || t('browse.extras.toolsTitle')}
      description={section.description}
    >
      <Box component="ul" sx={GRID_SX}>
        {section.tools.map((tool) => (
          <Paper
            component="li"
            key={tool._id}
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}
          >
            <ToolLogo tool={tool} size={48} decorative />
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, overflowWrap: 'anywhere' }}>
              {tool.name}
            </Typography>
          </Paper>
        ))}
      </Box>
    </DetailSection>
  );
};
