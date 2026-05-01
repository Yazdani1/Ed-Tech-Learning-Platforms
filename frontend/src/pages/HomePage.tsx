import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { courseService } from '../services/course.service';
import CourseCard from '../components/ui/CourseCard';
import PublicNavbar from '../components/layout/PublicNavbar';
import type { ICourse } from '../types/index';

const TOPICS = [
  'Web Development',
  'Data Science',
  'Mobile Apps',
  'UI/UX Design',
  'Mathematics',
  'Programming',
  'Business',
  'Digital Marketing',
];

const STATS = [
  { icon: <MenuBookIcon sx={{ color: 'primary.main' }} />, value: '100+', label: 'Courses' },
  { icon: <PeopleIcon sx={{ color: 'primary.main' }} />, value: '50+', label: 'Expert Teachers' },
  { icon: <PlayCircleIcon sx={{ color: 'primary.main' }} />, value: '1,000+', label: 'Students Enrolled' },
  { icon: <SchoolIcon sx={{ color: 'primary.main' }} />, value: '95%', label: 'Satisfaction Rate' },
];

export default function HomePage() {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { status: 'Published', visibility: 'Public' };
    if (query) params.search = query;
    courseService
      .getAll(params)
      .then((res) => setCourses(res.data ?? []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0d1b4b 0%, #1565c0 55%, #0288d1 100%)',
          color: 'white',
          py: { xs: 8, md: 13 },
          px: 2,
        }}
      >
        {/* Decorative blobs */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(2,136,209,0.25)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ maxWidth: 620 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                lineHeight: 1.15,
                mb: 2.5,
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
                letterSpacing: -1,
              }}
            >
              Learn Without
              <Box component="span" sx={{ color: '#7ec8f8' }}> Limits</Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                opacity: 0.88,
                mb: 4,
                lineHeight: 1.7,
                fontSize: { xs: '1rem', md: '1.15rem' },
              }}
            >
              Explore expert-taught courses in technology, design, business, and more.
              Advance your career at your own pace — anytime, anywhere.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                size="large"
                onClick={() =>
                  document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })
                }
                sx={{
                  bgcolor: 'white',
                  color: 'primary.dark',
                  fontWeight: 700,
                  px: 4,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                Explore Courses
              </Button>
              <Button
                size="large"
                variant="outlined"
                component={RouterLink}
                to="/auth/register"
                sx={{
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: 'white',
                  fontWeight: 700,
                  px: 4,
                  borderRadius: 2,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Start Free Today
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 3, md: 6 },
              py: 3,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            {STATS.map(({ icon, value, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {icon}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Topics ───────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pt: 6, pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Browse Top Topics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {TOPICS.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              clickable
              variant="outlined"
              onClick={() =>
                document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })
              }
              sx={{ borderRadius: 2, fontWeight: 500 }}
            />
          ))}
        </Box>
      </Container>

      <Divider sx={{ mx: { xs: 2, md: 'auto' }, maxWidth: 'lg', mt: 4 }} />

      {/* ── Courses ──────────────────────────────────────────────── */}
      <Box id="courses-section">
        <Container maxWidth="lg" sx={{ pt: 6, pb: 10 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {query ? `Results for "${query}"` : 'Popular Courses'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {query
                ? `${courses.length} course${courses.length !== 1 ? 's' : ''} found`
                : 'Hand-picked courses by our expert teachers'}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : courses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {query ? 'No courses match your search.' : 'No published courses yet.'}
              </Typography>
              {query && (
                <Button component={RouterLink} to="/" sx={{ mt: 2 }}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={3}>
              {courses.map((course) => (
                <Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <CourseCard course={course} basePath="/courses" />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'grey.900', color: 'grey.400', py: 5 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ color: 'primary.light', fontSize: 28 }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: -0.5 }}>
                MedhaBee
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['About', 'Courses', 'Teachers', 'Contact'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ cursor: 'pointer', '&:hover': { color: 'white' }, transition: 'color 0.2s' }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Box>
          <Divider sx={{ borderColor: 'grey.800', mb: 3 }} />
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            © {new Date().getFullYear()} MedhaBee E-Learning Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
