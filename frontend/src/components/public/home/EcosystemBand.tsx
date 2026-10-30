'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { EcosystemVisual } from './EcosystemVisual';
import { GLASS } from './glass';

const FORMAT_KEYS = ['live', 'recorded', 'seminar', 'language', 'quiz', 'portfolio'] as const;
const BAND_SX = {
  position: 'relative',
  overflow: 'hidden',
  color: 'common.white',
  background: 'linear-gradient(135deg, #050816 0%, #18204f 38%, #123c49 72%, #2d1b69 100%)',
} as const;
const TITLE_SX = {
  fontWeight: 900,
  fontSize: { xs: '2rem', md: '2.8rem' },
  lineHeight: 1.1,
  mb: 2,
} as const;

/** Dark "complete learning ecosystem" band with the animated 3D scene. */
export const EcosystemBand = () => {
  const { t } = useTranslation();
  return (
    <Box component="section" sx={BAND_SX}>
      <Container maxWidth="xl" sx={{ position: 'relative', py: { xs: 7, md: 9 } }}>
        <Grid container spacing={5} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Chip
              label={t('public.ecosystem.chip')}
              size="small"
              sx={{ ...GLASS, fontWeight: 800, mb: 2 }}
            />
            <Typography variant="h3" component="h2" sx={TITLE_SX}>
              {t('public.ecosystem.title')}
            </Typography>
            <Typography sx={{ lineHeight: 1.8, mb: 3, color: 'rgba(255,255,255,0.78)' }}>
              {t('public.ecosystem.body')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
              {FORMAT_KEYS.map((key) => (
                <Chip
                  key={key}
                  label={t(`public.ecosystem.${key}`)}
                  sx={{ ...GLASS, fontWeight: 800 }}
                />
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <EcosystemVisual />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
