import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import CheckIcon from '@mui/icons-material/Check';
import SchoolIcon from '@mui/icons-material/School';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { courseService } from '../../services/course.service';
import PublicNavbar from '../../components/layout/PublicNavbar';
import type { ICourse } from '../../types/index';
import { useAuth } from '../../context/useAuth';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;

const CARD_PALETTE = [
  { cardBg: '#e8f4fd', photoBg: '#bbdefb', accent: '#1565c0' },
  { cardBg: '#f3e8fd', photoBg: '#e1bee7', accent: '#6a1b9a' },
  { cardBg: '#e8fdf0', photoBg: '#c8e6c9', accent: '#2e7d32' },
  { cardBg: '#fdf6e8', photoBg: '#ffe0b2', accent: '#e65100' },
  { cardBg: '#fde8e8', photoBg: '#ffcdd2', accent: '#c62828' },
  { cardBg: '#e8fdfd', photoBg: '#b2ebf2', accent: '#00695c' },
];

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandAll, setExpandAll] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const isAdmin = user && (ADMIN_ROLES as readonly string[]).includes(user.role);
  const isStudent = user?.role === 'Student';

  const userActivePlan = user?.activeSubscription?.plan;
  const userSubExpiry = user?.activeSubscription?.endDate;
  const userSubValid = !!userActivePlan && !!userSubExpiry && new Date(userSubExpiry) > new Date();
  const courseInSub = (course?.includedInSubscription ?? false) && (course?.allowedSubscriptionPlans?.length ?? 0) > 0;
  const userSubCoversThisCourse =
    courseInSub && userSubValid && (course?.allowedSubscriptionPlans ?? []).includes(userActivePlan!);
  const userHasWrongPlan = courseInSub && isStudent && userSubValid && !userSubCoversThisCourse;
  const userHasNoSub = courseInSub && isStudent && !userSubValid;

  useEffect(() => {
    if (!id) return;
    courseService
      .getById(id)
      .then((r) => {
        const c = r.data;
        if (!c) return;
        if (c.visibility === 'Public' || user) {
          setCourse(c);
        } else {
          navigate('/auth/login');
        }
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  useEffect(() => {
    if (!id || !isStudent) return;
    courseService.checkEnrollment(id).then((r) => {
      setIsEnrolled(r.data?.isEnrolled ?? false);
    }).catch(() => { /* not enrolled */ });
  }, [id, isStudent]);

  const handleEnroll = async () => {
    if (!id) return;
    setEnrolling(true);
    try {
      await courseService.enroll(id);
      setIsEnrolled(true);
      toast.success('Enrolled successfully!');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <PublicNavbar />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
          <CircularProgress />
        </Box>
      </Box>
    );

  if (!course)
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <PublicNavbar />
        <Box sx={{ textAlign: 'center', mt: 12 }}>
          <Typography variant="h5">Course not found.</Typography>
          <Button component={RouterLink} to="/" sx={{ mt: 2 }}>Back to Home</Button>
        </Box>
      </Box>
    );

  const totalLectures = course.sections?.reduce((acc, s) => acc + s.lectures.length, 0) ?? 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicNavbar />

      {/* ── Dark hero ──────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#1c1d1f', color: 'white', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Left: course info */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Breadcrumb */}
              <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                <Typography
                  component={RouterLink}
                  to="/"
                  variant="caption"
                  sx={{ color: '#a78bfa', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Home
                </Typography>
                {course.category?.name && (
                  <>
                    <Typography variant="caption" sx={{ color: 'grey.500' }}>›</Typography>
                    <Typography variant="caption" sx={{ color: '#a78bfa' }}>
                      {course.category.name}
                    </Typography>
                  </>
                )}
              </Box>

              <Typography
                variant="h4"
                sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.25, fontSize: { xs: '1.6rem', md: '2rem' } }}
              >
                {course.title}
              </Typography>

              {course.subtitle && (
                <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.85, mb: 2, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                  {course.subtitle}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={course.status}
                  size="small"
                  sx={{ bgcolor: course.status === 'Published' ? '#16a34a' : '#6b7280', color: 'white', fontWeight: 600 }}
                />
                <Chip
                  label={course.pricing === 'Paid' ? `BDT ${course.price ?? ''}` : 'Free'}
                  size="small"
                  sx={{ bgcolor: course.pricing === 'Free' ? '#0284c7' : '#d97706', color: 'white', fontWeight: 600 }}
                />
                {course.includedInSubscription && (
                  <Chip label="Subscription" size="small" sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600 }} />
                )}
              </Box>

              {course.teachers?.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>Created by</Typography>
                  {course.teachers.map((t, i) => (
                    <Typography key={t._id} variant="body2" sx={{ color: '#a78bfa', fontWeight: 500 }}>
                      {t.name}{i < course.teachers.length - 1 ? ',' : ''}
                    </Typography>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Body ────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>

          {/* ── Left column ──────────────────────────────────────── */}
          <Grid size={{ xs: 12, md: 8 }}>

            {/* What you'll learn */}
            {course.whatYouWillLearn?.length > 0 && (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  mb: 4,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  What you&apos;ll learn
                </Typography>
                <Grid container spacing={1}>
                  {course.whatYouWillLearn.map((item, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <CheckIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.25, flexShrink: 0 }} />
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Course includes */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                This course includes
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { icon: <OndemandVideoIcon fontSize="small" />, text: `${totalLectures} on-demand video lectures` },
                  { icon: <AllInclusiveIcon fontSize="small" />, text: 'Full lifetime access' },
                  { icon: <DevicesIcon fontSize="small" />, text: 'Access on all devices' },
                  { icon: <WorkspacePremiumIcon fontSize="small" />, text: 'Certificate of completion' },
                ].map(({ icon, text }) => (
                  <Grid key={text} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Box sx={{ color: 'text.secondary' }}>{icon}</Box>
                      <Typography variant="body2">{text}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Course content */}
            {course.sections?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Course content
                  </Typography>
                  <Button size="small" onClick={() => setExpandAll((p) => !p)} sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {expandAll ? 'Collapse all sections' : 'Expand all sections'}
                  </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.sections.length} sections • {totalLectures} lectures
                </Typography>

                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  {course.sections.map((section, si) => (
                    <Accordion
                      key={section._id}
                      expanded={expandAll}
                      onChange={() => setExpandAll((p) => !p)}
                      elevation={0}
                      disableGutters
                      sx={{
                        borderBottom: si < course.sections.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&::before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ bgcolor: 'grey.50', px: 2.5, py: 1.5, minHeight: 56 }}
                      >
                        <Typography sx={{ fontWeight: 600, flex: 1 }}>{section.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                          {section.lectures.length} lecture{section.lectures.length !== 1 ? 's' : ''}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        {section.lectures.map((lecture, li) => (
                          <Box
                            key={lecture._id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              px: 2.5,
                              py: 1.25,
                              borderTop: li > 0 ? '1px solid' : 'none',
                              borderColor: 'divider',
                            }}
                          >
                            <PlayCircleOutlinedIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ flex: 1 }}>{lecture.title}</Typography>
                            {lecture.isPreview && (
                              <Chip label="Preview" size="small" color="info" variant="outlined" />
                            )}
                          </Box>
                        ))}
                        {section.lectures.length === 0 && (
                          <Box sx={{ px: 2.5, py: 2 }}>
                            <Typography variant="body2" color="text.secondary">No lectures yet.</Typography>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Box>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Requirements</Typography>
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                  {course.requirements.map((item, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.75 }}>
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Description */}
            {course.description && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>About this course</Typography>
                <Box
                  dangerouslySetInnerHTML={{ __html: course.description }}
                  sx={{ '& p': { mt: 0, mb: 1.5 }, '& ul': { pl: 3 }, lineHeight: 1.8 }}
                />
              </Box>
            )}

            <Divider sx={{ mb: 4 }} />

            {/* Teachers */}
            {course.teachers?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                  Your Instructors
                </Typography>
                <Grid container spacing={2}>
                  {course.teachers.map((teacher, idx) => {
                    const palette = CARD_PALETTE[idx % CARD_PALETTE.length];
                    return (
                      <Grid key={teacher._id} size={{ xs: 12, sm: 6, md: 6 }}>
                        <Box
                          sx={{
                            bgcolor: palette.cardBg,
                            borderRadius: 3,
                            p: 2.5,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                          }}
                        >
                          {/* Photo area */}
                          <Box
                            sx={{
                              width: 100,
                              height: 100,
                              borderRadius: '50%',
                              bgcolor: palette.photoBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                              flexShrink: 0,
                            }}
                          >
                            <Avatar
                              src={teacher.profileImage}
                              alt={teacher.name}
                              sx={{ width: 88, height: 88, fontSize: 32, bgcolor: palette.accent }}
                            >
                              {teacher.name.charAt(0)}
                            </Avatar>
                          </Box>

                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {teacher.name}
                          </Typography>

                          {teacher.bio && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1.5, lineHeight: 1.5 }}
                            >
                              {teacher.bio.length > 80 ? `${teacher.bio.slice(0, 80)}…` : teacher.bio}
                            </Typography>
                          )}

                          {teacher.expertise?.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                              {teacher.expertise.slice(0, 3).map((exp) => (
                                <Chip
                                  key={exp}
                                  label={exp}
                                  size="small"
                                  sx={{ bgcolor: palette.accent, color: 'white', fontWeight: 500, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </Grid>

          {/* ── Right sticky card ────────────────────────────────── */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: 'sticky', top: 84 }}>
              <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {/* Cover image */}
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {course.coverImage ? (
                    <Box
                      component="img"
                      src={course.coverImage}
                      alt={course.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <SchoolIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                  )}
                </Box>

                <Box sx={{ p: 3 }}>
                  {/* Price */}
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {course.pricing === 'Free' ? 'Free' : `৳ ${course.price?.toLocaleString() ?? ''}`}
                  </Typography>
                  {courseInSub && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Included in subscription:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {course.allowedSubscriptionPlans.map((p) => (
                          <Chip key={p} label={p} size="small" sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* CTA */}
                  {isAdmin ? (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
                      sx={{ fontWeight: 700, borderRadius: 2, mb: 1 }}
                    >
                      Edit Course
                    </Button>
                  ) : isStudent ? (
                    isEnrolled ? (
                      /* ── Already enrolled ──────────────────────── */
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        color="success"
                        startIcon={<CheckIcon />}
                        disabled
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        Enrolled
                      </Button>

                    ) : userSubCoversThisCourse ? (
                      /* ── Matching subscription ─────────────────── */
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            borderRadius: 2,
                            p: 1.5,
                            mb: 2,
                          }}
                        >
                          <CardMembershipIcon sx={{ color: '#7c3aed', fontSize: 20, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6d28d9', fontWeight: 700, display: 'block' }}>
                              Active subscription
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {userActivePlan} plan · Expires {new Date(userSubExpiry!).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={enrolling}
                          onClick={() => void handleEnroll()}
                          startIcon={<CardMembershipIcon />}
                          sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                        >
                          {enrolling ? <CircularProgress size={22} color="inherit" /> : 'Enroll with Subscription'}
                        </Button>
                      </>

                    ) : userHasWrongPlan ? (
                      /* ── Has subscription but wrong plan ─────────
                           Primary: free / paid enroll as usual
                           Secondary: plan mismatch info + upgrade     */
                      <>
                        {/* Primary enroll action */}
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={enrolling}
                          onClick={() => void handleEnroll()}
                          sx={{ fontWeight: 700, borderRadius: 2, mb: 2 }}
                        >
                          {enrolling
                            ? <CircularProgress size={22} color="inherit" />
                            : course.pricing === 'Free' ? 'Enroll Now — Free' : 'Buy Now'}
                        </Button>

                        {/* Subscription mismatch info */}
                        <Box
                          sx={{
                            bgcolor: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: 2,
                            p: 2,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400e', display: 'block', mb: 1.25 }}>
                            Plan upgrade required to enroll free
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary">Your current plan</Typography>
                            <Chip
                              label={userActivePlan}
                              size="small"
                              sx={{ bgcolor: '#0284c7', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">Required plan</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {course.allowedSubscriptionPlans.map((p) => (
                                <Chip
                                  key={p}
                                  label={p}
                                  size="small"
                                  sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          </Box>

                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            component={RouterLink}
                            to="/pricing"
                            startIcon={<CardMembershipIcon />}
                            sx={{ fontWeight: 600, borderRadius: 2, color: '#92400e', borderColor: '#f97316', '&:hover': { bgcolor: '#fff7ed', borderColor: '#ea580c' } }}
                          >
                            Upgrade Subscription
                          </Button>
                        </Box>
                      </>

                    ) : userHasNoSub ? (
                      /* ── No active subscription ─────────────────
                           Primary: free / paid enroll as usual
                           Secondary: subscription offer info          */
                      <>
                        {/* Primary enroll action */}
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={enrolling}
                          onClick={() => void handleEnroll()}
                          sx={{ fontWeight: 700, borderRadius: 2, mb: 2 }}
                        >
                          {enrolling
                            ? <CircularProgress size={22} color="inherit" />
                            : course.pricing === 'Free' ? 'Enroll Now — Free' : 'Buy Now'}
                        </Button>

                        {/* Subscription upsell */}
                        <Box
                          sx={{
                            bgcolor: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            borderRadius: 2,
                            p: 2,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#5b21b6', display: 'block', mb: 1 }}>
                            Also available with a subscription
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Enroll for free with:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                            {course.allowedSubscriptionPlans.map((p) => (
                              <Chip
                                key={p}
                                label={p}
                                size="small"
                                sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            component={RouterLink}
                            to="/pricing"
                            startIcon={<CardMembershipIcon />}
                            sx={{ fontWeight: 600, borderRadius: 2, color: '#7c3aed', borderColor: '#7c3aed', '&:hover': { bgcolor: '#f5f3ff', borderColor: '#6d28d9' } }}
                          >
                            View Subscription Plans
                          </Button>
                        </Box>
                      </>

                    ) : (
                      /* ── No subscription relevance (free or paid, no sub needed) */
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={enrolling}
                        onClick={() => void handleEnroll()}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        {enrolling ? <CircularProgress size={22} color="inherit" /> : (course.pricing === 'Free' ? 'Enroll Now — Free' : 'Buy Now')}
                      </Button>
                    )
                  ) : (
                    /* Not logged in */
                    <>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to="/auth/register"
                        sx={{ fontWeight: 700, borderRadius: 2, mb: 1 }}
                      >
                        {course.pricing === 'Free' ? 'Enroll Free' : 'Get Started'}
                      </Button>
                      {courseInSub && (
                        <Button
                          fullWidth
                          variant="outlined"
                          size="large"
                          component={RouterLink}
                          to="/pricing"
                          startIcon={<CardMembershipIcon />}
                          sx={{ fontWeight: 600, borderRadius: 2, mb: 1, color: '#7c3aed', borderColor: '#7c3aed', '&:hover': { borderColor: '#6d28d9', bgcolor: '#f5f3ff' } }}
                        >
                          Enroll with Subscription
                        </Button>
                      )}
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        component={RouterLink}
                        to="/auth/login"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                      >
                        Sign In
                      </Button>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Features */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    This course includes:
                  </Typography>
                  {[
                    { icon: <OndemandVideoIcon fontSize="small" />, text: `${totalLectures} video lectures` },
                    { icon: <AllInclusiveIcon fontSize="small" />, text: 'Full lifetime access' },
                    { icon: <DevicesIcon fontSize="small" />, text: 'Access on any device' },
                    { icon: <WorkspacePremiumIcon fontSize="small" />, text: 'Certificate of completion' },
                  ].map(({ icon, text }) => (
                    <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
                      <Typography variant="body2">{text}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
