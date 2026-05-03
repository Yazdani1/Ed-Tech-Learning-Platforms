import { useEffect, useRef, useState } from 'react';
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
import { categoryService } from '../services/category.service';
import { courseTypeService } from '../services/courseType.service';
import CourseCard from '../components/ui/CourseCard';
import PublicNavbar from '../components/layout/PublicNavbar';
import CourseFilterSidebar from '../components/course/CourseFilterSidebar';
import { encodeParam, decodeParam } from '../utils/urlParams';
import type { ICourse, ICategory, ICourseType, SubscriptionPlan } from '../types/index';

const STATS = [
  { icon: <MenuBookIcon sx={{ color: 'primary.main' }} />, value: '100+', label: 'Courses' },
  { icon: <PeopleIcon sx={{ color: 'primary.main' }} />, value: '50+', label: 'Expert Teachers' },
  { icon: <PlayCircleIcon sx={{ color: 'primary.main' }} />, value: '1,000+', label: 'Students Enrolled' },
  { icon: <SchoolIcon sx={{ color: 'primary.main' }} />, value: '95%', label: 'Satisfaction Rate' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();

  // ── All filter values derived from URL (decoded) ────────────
  const urlSearch = decodeParam(searchParams.get('q') ?? '');
  const urlCourseTypes = decodeParam(searchParams.get('courseTypes') ?? '').split(',').filter(Boolean);
  const urlCategories = decodeParam(searchParams.get('categories') ?? '').split(',').filter(Boolean);
  const urlPlans = decodeParam(searchParams.get('subscriptionPlans') ?? '').split(',').filter(Boolean) as SubscriptionPlan[];

  // ── Local state for search input only (smooth typing) ────────
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDebouncing = useRef(false);

  // ── Reference data ───────────────────────────────────────────
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);

  // ── Fetch state: derived loading ─────────────────────────────
  const [fetchState, setFetchState] = useState<{ key: string; courses: ICourse[] }>({
    key: '__init__',
    courses: [],
  });
  const loading = fetchState.key !== paramsKey;

  useEffect(() => {
    if (!isDebouncing.current) setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    Promise.all([categoryService.getAll(), courseTypeService.getAll()]).then(([cats, cts]) => {
      setCategories(cats.data ?? []);
      setCourseTypes(cts.data ?? []);
    });
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (urlSearch) params.search = urlSearch;
    if (urlCourseTypes.length > 0) params.courseTypes = urlCourseTypes.join(',');
    if (urlCategories.length > 0) params.categories = urlCategories.join(',');
    if (urlPlans.length > 0) params.subscriptionPlans = urlPlans.join(',');

    courseService
      .browse(params)
      .then((res) => {
        const data = res.data;
        setFetchState({
          key: paramsKey,
          courses: Array.isArray(data) ? data.filter((c): c is ICourse => Boolean(c?._id)) : [],
        });
      })
      .catch(() => setFetchState({ key: paramsKey, courses: [] }));
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── URL helpers ──────────────────────────────────────────────
  const updateParams = (patch: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, val] of Object.entries(patch)) {
        if (val) next.set(key, encodeParam(val));
        else next.delete(key);
      }
      return next;
    }, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    isDebouncing.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      isDebouncing.current = false;
      updateParams({ q: value.trim() || null });
    }, 350);
  };

  const toggleCourseType = (id: string) => {
    const next = urlCourseTypes.includes(id) ? urlCourseTypes.filter((x) => x !== id) : [...urlCourseTypes, id];
    updateParams({ courseTypes: next.join(',') || null });
  };

  const toggleCategory = (id: string) => {
    const next = urlCategories.includes(id) ? urlCategories.filter((x) => x !== id) : [...urlCategories, id];
    updateParams({ categories: next.join(',') || null });
  };

  const togglePlan = (plan: SubscriptionPlan) => {
    const next = urlPlans.includes(plan) ? urlPlans.filter((x) => x !== plan) : [...urlPlans, plan];
    updateParams({ subscriptionPlans: next.join(',') || null });
  };

  const clearAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = urlCourseTypes.length + urlCategories.length + urlPlans.length;
  const hasActiveFilter = urlSearch || activeFilterCount > 0;

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
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '30%', right: '15%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(2,136,209,0.25)', pointerEvents: 'none' }} />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ maxWidth: 620 }}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 900, lineHeight: 1.15, mb: 2.5, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' }, letterSpacing: -1 }}
            >
              Learn Without
              <Box component="span" sx={{ color: '#7ec8f8' }}> Limits</Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{ fontWeight: 400, opacity: 0.88, mb: 4, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.15rem' } }}
            >
              Explore expert-taught courses in technology, design, business, and more.
              Advance your career at your own pace — anytime, anywhere.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                size="large"
                onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}
                sx={{ bgcolor: 'white', color: 'primary.dark', fontWeight: 700, px: 4, borderRadius: 2, '&:hover': { bgcolor: 'grey.100' } }}
              >
                Explore Courses
              </Button>
              <Button
                size="large"
                variant="outlined"
                component={RouterLink}
                to="/auth/register"
                sx={{ borderColor: 'rgba(255,255,255,0.7)', color: 'white', fontWeight: 700, px: 4, borderRadius: 2, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
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
          <Box sx={{ display: 'flex', gap: { xs: 3, md: 6 }, py: 3, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
            {STATS.map(({ icon, value, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {icon}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Divider sx={{ mx: { xs: 2, md: 'auto' }, maxWidth: 'lg', mt: 2 }} />

      {/* ── Courses + Filter ─────────────────────────────────────── */}
      <Box id="courses-section">
        <Container maxWidth="xl" sx={{ pt: 6, pb: 10 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {hasActiveFilter ? 'Search Results' : 'Popular Courses'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {loading
                ? 'Loading…'
                : hasActiveFilter
                  ? `${fetchState.courses.length} course${fetchState.courses.length !== 1 ? 's' : ''} found`
                  : 'Hand-picked courses by our expert teachers'}
              {activeFilterCount > 0 && (
                <Chip
                  label={`${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
                  size='small'
                  color='primary'
                  sx={{ ml: 1, fontWeight: 700 }}
                />
              )}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {/* LEFT: filters */}
            <Box sx={{ width: 272, flexShrink: 0, position: 'sticky', top: 88 }}>
              <CourseFilterSidebar
                searchInput={searchInput}
                onSearchChange={handleSearchChange}
                courseTypes={courseTypes}
                selectedCourseTypes={urlCourseTypes}
                onToggleCourseType={toggleCourseType}
                categories={categories}
                selectedCategories={urlCategories}
                onToggleCategory={toggleCategory}
                selectedPlans={urlPlans}
                onTogglePlan={togglePlan}
                activeFilterCount={activeFilterCount}
                onClearAll={clearAll}
              />
            </Box>

            {/* RIGHT: grid */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              ) : fetchState.courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {hasActiveFilter ? 'No courses match your filters.' : 'No published courses yet.'}
                  </Typography>
                  {hasActiveFilter && (
                    <Button onClick={clearAll} sx={{ mt: 2 }}>Clear filters</Button>
                  )}
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {fetchState.courses.map((course) => (
                    <Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <CourseCard course={course} basePath="/courses" />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'grey.900', color: 'grey.400', py: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ color: 'primary.light', fontSize: 28 }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: -0.5 }}>MedhaBee</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['About', 'Courses', 'Teachers', 'Contact'].map((item) => (
                <Typography key={item} variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: 'white' }, transition: 'color 0.2s' }}>
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
