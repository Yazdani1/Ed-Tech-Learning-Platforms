import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

const DARK = 'rgba(255,255,255,0.12)';
const HERO_BG = '#070f26';
const PILL = { bgcolor: DARK, borderRadius: 99 } as const;

/** The dark banner's placeholder: breadcrumbs, batch + type badges, title, subtitle, price, Enroll button. */
export const HeroSkeleton = () => (
  <Box sx={{ bgcolor: HERO_BG, py: { xs: 4, md: 5 } }}>
    <Container maxWidth="lg">
      <Grid container>
        <Grid size={{ xs: 12, md: 8 }} sx={{ pr: { md: 4 } }}>
          <Skeleton variant="text" sx={{ bgcolor: DARK, width: '45%', mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Skeleton variant="rounded" width={96} height={28} sx={PILL} />
            <Skeleton variant="rounded" width={140} height={28} sx={PILL} />
          </Box>
          <Skeleton variant="text" sx={{ bgcolor: DARK, fontSize: '2.4rem', width: '90%' }} />
          <Skeleton variant="text" sx={{ bgcolor: DARK, fontSize: '2.4rem', width: '60%' }} />
          <Skeleton variant="text" sx={{ bgcolor: DARK, width: '70%', mb: 3 }} />
          <Skeleton variant="text" sx={{ bgcolor: DARK, fontSize: '2rem', width: 180 }} />
          <Skeleton
            variant="rounded"
            width={200}
            height={52}
            sx={{ bgcolor: DARK, mt: 2, borderRadius: '12px' }}
          />
        </Grid>
      </Grid>
    </Container>
  </Box>
);
