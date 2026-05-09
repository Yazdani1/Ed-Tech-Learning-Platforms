import { useState, useEffect, useRef, useMemo } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  Pagination,
  PaginationItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  FormControl,
  MenuItem,
  Select,
  TextField,
  InputAdornment,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import toast from 'react-hot-toast';
import AppPagination from '../../components/common/AppPagination';
import { quizBankService } from '../../services/quizBank.service';
import type {
  IPublicQuizSection,
  IPublicCourse,
  IQuizBank,
  IQuizAttempt,
  IQuizQuestion,
  ICategory,
  ICourseType,
} from '../../types/index';
import { useAuth } from '../../context/useAuth';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import SearchIcon from '@mui/icons-material/Search';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
type Subsection = 'all' | 'incorrect' | 'correct';

function arraysEqualSorted(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

type LocalAnswer = { selectedOptionIndices: number[]; isCorrect: boolean };

function getSubsectionQuestions(
  bank: IQuizBank,
  answers: Map<string, LocalAnswer>,
  sub: Subsection,
): IQuizQuestion[] {
  if (sub === 'all') return bank.questions;
  if (sub === 'incorrect')
    return bank.questions.filter((q) => {
      const a = answers.get(q._id);
      return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
    });
  return bank.questions.filter((q) => answers.get(q._id)?.isCorrect === true);
}

export default function PracticeQuizPage() {
  const { user } = useAuth();
  const { confirm } = useConfirmModal();
  const isLoggedIn = Boolean(user);

  // ── Course list ──────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<IPublicCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedBanks, setExpandedBanks] = useState<string[]>([]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedPricing, setSelectedPricing] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cid = searchParams.get('courseId');
    const bid = searchParams.get('bankId');
    if (cid) setSelectedCourseId(cid);
    if (bid) setSelectedBankId(bid);
  }, [searchParams]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCourseType('');
    setSelectedPricing('');
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Section/bank tree ────────────────────────────────────────────────────
  const [sections, setSections] = useState<IPublicQuizSection[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [lockedBankCount, setLockedBankCount] = useState(0);
  const [lockedQuestionCount, setLockedQuestionCount] = useState(0);

  // ── Practice state ───────────────────────────────────────────────────────
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<Subsection>('all');
  const [attempt, setAttempt] = useState<IQuizAttempt | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const attemptRef = useRef<IQuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Unified answers map for the entire course session (questionId -> LocalAnswer)
  const [courseAnswers, setCourseAnswers] = useState<Map<string, LocalAnswer>>(new Map());

  const [courseStatsOpen, setCourseStatsOpen] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isChecked, setIsChecked] = useState(false);

  const allBanks = useMemo(() => sections.flatMap((s) => s.banks), [sections]);

  useEffect(() => { attemptRef.current = attempt; }, [attempt]);

  // Merge attempt answers into courseAnswers when a new attempt is loaded
  useEffect(() => {
    if (attempt) {
      setCourseAnswers((prev) => {
        const next = new Map(prev);
        attempt.answers.forEach((a) => {
          next.set(a.questionId, {
            selectedOptionIndices: a.selectedOptionIndices,
            isCorrect: a.isCorrect,
          });
        });
        return next;
      });
    }
  }, [attempt]);


  // Fetch categories and course types on mount
  useEffect(() => {
    categoryService.getAll().then((r) => setCategories(r.data ?? []));
    courseTypeService.getAll().then((r) => setCourseTypes(r.data ?? []));
  }, []);

  // Fetch courses with free preview quizzes based on filters
  useEffect(() => {
    setCoursesLoading(true);
    const params = {
      search: debouncedSearch || undefined,
      categories: selectedCategory || undefined,
      courseTypes: selectedCourseType || undefined,
      pricing: selectedPricing || undefined,
    };
    quizBankService
      .getPublicCourses(params)
      .then((r) => setCourses(r.data ?? []))
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, [debouncedSearch, selectedCategory, selectedCourseType, selectedPricing]);

  // Fetch section/bank tree when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setSections([]);
      setLockedBankCount(0);
      setLockedQuestionCount(0);
      return;
    }
    Promise.all([
      quizBankService.getPublicCourseTree(selectedCourseId),
      isLoggedIn
        ? quizBankService.getCourseAttempts(selectedCourseId)
        : Promise.resolve({ data: [] as IQuizAttempt[] }),
    ])
      .then(([treeRes, attemptRes]) => {
        const fetchedSections = treeRes.data?.sections ?? [];
        setSections(fetchedSections);
        setLockedBankCount(treeRes.data?.lockedBankCount ?? 0);
        setLockedQuestionCount(treeRes.data?.lockedQuestionCount ?? 0);

        // Populate courseAnswers from all fetched attempts
        const fetchedAttempts = attemptRes.data ?? [];
        setCourseAnswers((prev) => {
          const next = new Map(prev);
          fetchedAttempts.forEach((att) => {
            att.answers.forEach((ans) => {
              next.set(ans.questionId, {
                selectedOptionIndices: ans.selectedOptionIndices,
                isCorrect: ans.isCorrect,
              });
            });
          });
          return next;
        });

        // Expand first section and its first bank by default
        if (fetchedSections.length > 0) {
          setExpandedSections([fetchedSections[0]._id]);
          if (fetchedSections[0].banks.length > 0) {
            setExpandedBanks([fetchedSections[0].banks[0]._id]);
          }
        } else {
          setExpandedSections([]);
          setExpandedBanks([]);
        }
      })
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, [selectedCourseId]);


  // Load API attempt when bank selected (logged-in only)
  useEffect(() => {
    if (!selectedBankId || !isLoggedIn) { setAttempt(null); return; }
    setAttemptLoading(true);
    quizBankService
      .getMyAttempt(selectedBankId)
      .then((r) => setAttempt(r.data ?? null))
      .catch(() => {})
      .finally(() => setAttemptLoading(false));
  }, [selectedBankId, isLoggedIn]);

  // Reset practice on bank/subsection change
  useEffect(() => {
    setCurrentPage(0);
    setSelectedOptions([]);
    setIsChecked(false);
  }, [selectedBankId, selectedSubsection, isLoggedIn]);


  // Pre-populate from existing attempt ('all' + logged-in only)
  useEffect(() => {
    if (selectedSubsection !== 'all' || !isLoggedIn) {
      setSelectedOptions([]);
      setIsChecked(false);
      return;
    }
    const bank = allBanks.find((b) => b._id === selectedBankId);
    if (!bank) return;
    const qs = getSubsectionQuestions(bank, courseAnswers, 'all');
    const q = qs[currentPage];
    if (!q) return;
    const existing = courseAnswers.get(q._id);
    if (existing && existing.selectedOptionIndices.length > 0) {
      setSelectedOptions(existing.selectedOptionIndices);
      setIsChecked(true);
    } else {
      setSelectedOptions([]);
      setIsChecked(false);
    }
  }, [currentPage, selectedBankId, selectedSubsection, isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps



  const selectedBank = allBanks.find((b) => b._id === selectedBankId) ?? null;
  const activeQuestions = selectedBank
    ? getSubsectionQuestions(selectedBank, courseAnswers, selectedSubsection)
    : [];
  const currentQuestion = activeQuestions[currentPage] ?? null;

  const totalQ = selectedBank?.questions.length ?? 0;
  const correctCount =
    selectedBank?.questions.filter((q) => courseAnswers.get(q._id)?.isCorrect).length ?? 0;
  const incorrectCount =
    selectedBank?.questions.filter((q) => {
      const a = courseAnswers.get(q._id);
      return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
    }).length ?? 0;
  const progressPct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

  // Course-level stats
  const allCourseQuestions = allBanks.flatMap((b) => b.questions);
  const courseTotalQ = allCourseQuestions.length;
  const courseTotalCorrect = allCourseQuestions.filter((q) => courseAnswers.get(q._id)?.isCorrect).length;
  const courseTotalIncorrect = allCourseQuestions.filter((q) => {
    const a = courseAnswers.get(q._id);
    return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
  }).length;
  const courseTotalAnswered = courseTotalCorrect + courseTotalIncorrect;
  const courseTotalRemaining = courseTotalQ - courseTotalAnswered;
  const courseProgressPct = courseTotalQ > 0 ? Math.round((courseTotalCorrect / courseTotalQ) * 100) : 0;

  const selectedCourse = courses.find((c) => c._id === selectedCourseId) ?? null;
  const selectedCourseSidebar =
    selectedCourseId && !treeLoading && selectedCourse ? (
      <Box
        sx={{
          width: 360,
          flexShrink: 0,
          p: { xs: 2, md: 2.5 },
          overflow: 'auto',
        }}
      >
        <Paper
          variant='outlined'
          sx={{
            p: 3,
            borderRadius: 0.5,
            bgcolor: 'background.paper',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Box
              component='img'
              src={selectedCourse.coverImage || 'https://via.placeholder.com/340x200?text=Course+Cover'}
              sx={{
                width: '100%',
                aspectRatio: '16/9',
                objectFit: 'cover',
                borderRadius: 0.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                mb: 2.5,
              }}
            />
            <Typography
              variant='h6'
              sx={{ fontWeight: 900, mb: 1, lineHeight: 1.25, letterSpacing: '-0.01em' }}
            >
              {selectedCourse.title}
            </Typography>
            {selectedCourse.subtitle && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mb: 2, lineHeight: 1.5 }}
              >
                {selectedCourse.subtitle}
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2.5} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 0.5,
                  bgcolor: lockedBankCount > 0 ? 'warning.50' : 'success.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: lockedBankCount > 0 ? 'warning.100' : 'success.100',
                }}
              >
                {lockedBankCount > 0 ? (
                  <LockOutlinedIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                ) : (
                  <LockOpenOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                )}
              </Box>
              <Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{
                    fontWeight: 700,
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.65rem',
                  }}
                >
                  Access Status
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 800,
                    color: lockedBankCount > 0 ? 'warning.dark' : 'success.dark',
                  }}
                >
                  {lockedBankCount} Quiz Bank{lockedBankCount !== 1 ? 's' : ''} Locked
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 0.5,
                  bgcolor: 'primary.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'primary.100',
                }}
              >
                <QuizOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{
                    fontWeight: 700,
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.65rem',
                  }}
                >
                  Course Content
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {lockedQuestionCount + courseTotalQ} Total Questions
                </Typography>
              </Box>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 0.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ mb: 2 }}>
              {selectedCourse.pricing === 'Free' ? (
                <Typography variant='h6' sx={{ fontWeight: 900, color: 'success.main' }}>
                  Free Enrollment
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant='h5' sx={{ fontWeight: 900, color: 'text.primary' }}>
                      $
                      {selectedCourse.discountPrice ??
                        selectedCourse.price ??
                        selectedCourse.listPrice ??
                        0}
                    </Typography>
                    {(selectedCourse.discountPercent ?? 0) > 0 && (
                      <Chip
                        label={`-${selectedCourse.discountPercent}%`}
                        size='small'
                        color='error'
                        sx={{
                          fontWeight: 900,
                          borderRadius: 0.5,
                          height: 20,
                          fontSize: '0.65rem',
                        }}
                      />
                    )}
                  </Box>
                  {selectedCourse.discountPrice != null &&
                    (selectedCourse.listPrice ?? selectedCourse.price) != null && (
                      <Typography
                        variant='caption'
                        sx={{
                          textDecoration: 'line-through',
                          color: 'text.disabled',
                          fontWeight: 600,
                        }}
                      >
                        Original: ${selectedCourse.listPrice ?? selectedCourse.price}
                      </Typography>
                    )}
                </>
              )}
            </Box>

            <Button
              variant='contained'
              fullWidth
              color={lockedBankCount > 0 ? 'warning' : 'primary'}
              component={RouterLink}
              to={`/courses/${selectedCourseId}`}
              startIcon={lockedBankCount > 0 ? <LockOpenOutlinedIcon /> : <SchoolOutlinedIcon />}
              sx={{
                fontWeight: 900,
                borderRadius: 0.5,
                py: 1.5,
                boxShadow:
                  lockedBankCount > 0
                    ? '0 10px 25px rgba(245,158,11,0.2)'
                    : '0 10px 25px rgba(25, 118, 210, 0.2)',
                textTransform: 'none',
                fontSize: '0.95rem',
              }}
            >
              {lockedBankCount > 0 ? 'Unlock Course' : 'View Details'}
            </Button>
          </Box>
        </Paper>
      </Box>
    ) : null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectBank = (bankId: string, sub: Subsection) => {
    setSelectedBankId(bankId);
    setSelectedSubsection(sub);
    // Ensure the bank is expanded when selected
    if (!expandedBanks.includes(bankId)) {
      setExpandedBanks((prev) => [...prev, bankId]);
    }
  };


  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    );
  };

  const toggleBank = (bankId: string) => {
    setExpandedBanks((prev) =>
      prev.includes(bankId) ? prev.filter((id) => id !== bankId) : [...prev, bankId],
    );
  };


  const handleToggleOption = (idx: number) => {
    if (isChecked) return;
    setSelectedOptions((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const handleCheck = async () => {
    if (!currentQuestion || selectedOptions.length === 0) return;
    if (isLoggedIn && selectedBankId) {
      setSubmitting(true);
      try {
        const res = await quizBankService.submitAnswer(selectedBankId, {
          questionId: currentQuestion._id,
          selectedOptionIndices: selectedOptions,
        });
        setAttempt(res.data ?? null);
        setIsChecked(true);
      } catch {
        // handled by interceptor
      } finally {
        setSubmitting(false);
      }
    } else {
      const isCorrect = arraysEqualSorted(
        selectedOptions,
        currentQuestion.correctOptionIndices,
      );
      setCourseAnswers((prev) => {
        const next = new Map(prev);
        next.set(currentQuestion._id, { selectedOptionIndices: selectedOptions, isCorrect });
        return next;
      });
      setIsChecked(true);
    }
  };


  const handleNext = () => {
    if (currentPage < activeQuestions.length - 1) setCurrentPage((p) => p + 1);
  };

  const handleSkip = () => {
    if (currentPage < activeQuestions.length - 1) setCurrentPage((p) => p + 1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page - 1);
    setSelectedOptions([]);
    setIsChecked(false);
  };

  const handleResetAttempt = async () => {
    if (!selectedBankId) return;
    if (isLoggedIn) {
      const ok = await confirm({
        title: 'Reset Practice',
        message: 'Clear all your saved answers for this quiz bank?',
        confirmText: 'Reset',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      await quizBankService.resetAttempt(selectedBankId);
      setAttempt(null);
      // Remove answers for this specific bank from courseAnswers
      setCourseAnswers(prev => {
        const next = new Map(prev);
        selectedBank?.questions.forEach(q => next.delete(q._id));
        return next;
      });
    } else {
      setCourseAnswers(prev => {
        const next = new Map(prev);
        selectedBank?.questions.forEach(q => next.delete(q._id));
        return next;
      });
    }
    setCurrentPage(0);

    setSelectedOptions([]);
    setIsChecked(false);
    toast.success('Practice reset');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PublicNavbar />

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 68px)',
        }}
      >
        {/* ── Column 1: Course list ─────────────────────────────────── */}
        <Box
          sx={{
            width: 380,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header & Filters */}
          <Box
            sx={{
              px: 2,
              py: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
                Browse Free Quizzes
              </Typography>
              {(search || selectedCategory || selectedCourseType || selectedPricing) && (
                <Button 
                  size="small" 
                  onClick={clearFilters}
                  sx={{ p: 0, minWidth: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}
                >
                  Clear All
                </Button>
              )}
            </Box>

            <Stack spacing={1.5}>
              <TextField
                size='small'
                placeholder='Search courses...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 0.5, bgcolor: 'background.default' },
                }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth size='small'>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 0.5, fontSize: '0.8rem', bgcolor: 'background.default' }}
                  >
                    <MenuItem value=''>All Categories</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size='small'>
                  <Select
                    value={selectedPricing}
                    onChange={(e) => setSelectedPricing(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 0.5, fontSize: '0.8rem', bgcolor: 'background.default' }}
                  >
                    <MenuItem value=''>All Pricing</MenuItem>
                    <MenuItem value='Free'>Free Only</MenuItem>
                    <MenuItem value='Paid'>Paid Only</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <FormControl fullWidth size='small'>
                <Select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: 0.5, fontSize: '0.8rem', bgcolor: 'background.default' }}
                >
                  <MenuItem value=''>All Course Types</MenuItem>
                  {courseTypes.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {coursesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={22} />
            </Box>
          ) : courses.length === 0 ? (
            <Box sx={{ px: 2, py: 3 }}>
              <Typography variant='caption' color='text.secondary'>
                No free preview quizzes available yet.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ py: 2 }}>
              {courses.map((course) => {
                const isSelected = selectedCourseId === course._id;
                return (
                  <ListItemButton
                    key={course._id}
                    selected={isSelected}
                    onClick={() => setSelectedCourseId(course._id)}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      mx: 2,
                      borderRadius: 0.5,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: isSelected ? 'rgba(245, 158, 11, 0.06)' : 'background.paper',
                      background: isSelected ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)' : 'background.paper',
                      position: 'relative',
                      overflow: 'hidden',
                      '&.Mui-selected': {
                        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          bgcolor: 'warning.main',
                        },
                      },
                      '&:hover': {
                        borderColor: 'warning.light',
                        transform: 'translateX(4px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                        bgcolor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.04)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 90,
                        height: 90,
                        flexShrink: 0,
                        borderRadius: 0.5,
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Box
                        component='img'
                        src={course.coverImage || 'https://via.placeholder.com/90x90?text=Course'}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                          '.MuiListItemButton-root:hover &': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          lineHeight: 1.3,
                          mb: 0.5,
                          color: isSelected ? 'warning.dark' : 'text.primary',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {course.title}
                      </Typography>

                      {course.subtitle && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1,
                            fontSize: '0.72rem',
                          }}
                        >
                          {course.subtitle}
                        </Typography>
                      )}

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}
                      >
                        {course.pricing === 'Free' ? (
                          <Typography
                            sx={{ fontWeight: 800, color: 'success.main', fontSize: '0.85rem' }}
                          >
                            Free
                          </Typography>
                        ) : (
                          <>
                            <Typography
                              sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.9rem' }}
                            >
                              $
                              {course.discountPrice ??
                                course.price ??
                                course.listPrice ??
                                0}
                            </Typography>
                            {course.discountPrice != null &&
                              (course.listPrice ?? course.price) != null && (
                                <Typography
                                  variant='caption'
                                  sx={{
                                    textDecoration: 'line-through',
                                    color: 'text.disabled',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  ${course.listPrice ?? course.price}
                                </Typography>
                              )}
                          </>
                        )}
                        {course.includedInSubscription && (
                          <Chip
                            label='Sub'
                            size='small'
                            color='info'
                            variant='outlined'
                            sx={{
                              fontSize: '0.6rem',
                              height: 16,
                              borderRadius: 0.5,
                              fontWeight: 700,
                            }}
                          />
                        )}
                        {isSelected && (
                          <Box
                            sx={{
                              ml: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              color: 'success.main',
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 20 }} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        {/* ── Column 2: Selected Course Details (Vertical Sidebar) ───── */}
        {selectedCourseSidebar}

        {/* ── Column 3: Practice panel ──────────────────────────────── */}
        <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {/* Course-level stats */}
          {selectedCourseId && !treeLoading && courseTotalQ > 0 && (
            <Paper
              variant='outlined'
              sx={{
                mx: { xs: 2, md: 2.5 },
                mt: { xs: 2, md: 2.5 },
                mb: 0,
                borderRadius: 0.5,
                bgcolor: 'background.paper',
                overflow: 'hidden',
              }}
            >
              <Box
                onClick={() => setCourseStatsOpen((p) => !p)}
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total', value: courseTotalQ, color: 'text.primary' },
                    { label: 'Answered', value: courseTotalAnswered, color: 'primary.main' },
                    { label: 'Correct', value: courseTotalCorrect, color: 'success.main' },
                    { label: 'Incorrect', value: courseTotalIncorrect, color: 'error.main' },
                    { label: 'Not Answered Yet', value: courseTotalRemaining, color: 'warning.main' },
                  ].map(({ label, value, color }, i, arr) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                        {label}:
                      </Typography>
                      <Typography variant='caption' sx={{ fontWeight: 800, color }}>
                        {value}
                      </Typography>
                      {i < arr.length - 1 && (
                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'action.disabled', ml: 0.5 }} />
                      )}
                    </Box>
                  ))}
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {courseProgressPct}% accuracy
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: courseStatsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </Box>
              <Collapse in={courseStatsOpen}>
                <Box sx={{ px: 2, pb: 1.25 }}>
                  <Box sx={{ height: 6, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden', display: 'flex' }}>
                    <Box sx={{ width: `${(courseTotalCorrect / courseTotalQ) * 100}%`, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
                    <Box sx={{ width: `${(courseTotalIncorrect / courseTotalQ) * 100}%`, bgcolor: 'error.main', transition: 'width 0.4s ease' }} />
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          )}

          {!selectedBankId ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                p: 4,
                color: 'text.secondary',
              }}
            >
              <QuizOutlinedIcon sx={{ fontSize: 84, opacity: 0.12 }} />
              <Typography variant='h6' sx={{ fontWeight: 700, opacity: 0.3 }}>
                {!selectedCourseId
                  ? 'Select a course and quiz to start practising'
                  : 'Select a quiz from the panel to start'}
              </Typography>
              {!isLoggedIn && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1,
                    px: 2.5,
                    py: 1.25,
                    bgcolor: 'info.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'info.200',
                    maxWidth: 440,
                  }}
                >
                  <LockOpenOutlinedIcon fontSize='small' color='info' />
                  <Typography variant='body2' color='info.dark'>
                    Sign in to save your progress and track wrong / correct answers.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 760, mx: 'auto' }}>
              {/* Bank title + subsection badge */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                  {selectedBank?.title}
                </Typography>
                {selectedBank?.description && (
                  <Typography variant='body2' color='text.secondary'>
                    {selectedBank.description}
                  </Typography>
                )}
                <Stack direction='row' spacing={1} sx={{ mt: 1.25 }}>
                  <Chip
                    size='small'
                    label={
                      selectedSubsection === 'all'
                        ? 'All Questions'
                        : selectedSubsection === 'incorrect'
                        ? 'Incorrect Questions'
                        : 'Correct Questions'
                    }
                    color={
                      selectedSubsection === 'all'
                        ? 'default'
                        : selectedSubsection === 'incorrect'
                        ? 'error'
                        : 'success'
                    }
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    size='small'
                    label={`${activeQuestions.length} question${activeQuestions.length !== 1 ? 's' : ''}`}
                    variant='outlined'
                  />
                </Stack>
              </Box>

              {/* Progress bar */}
              {selectedBank && (isLoggedIn ? !attemptLoading : correctCount + incorrectCount > 0) && (
              <Paper variant='outlined' sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 }, mb: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800 }}>{totalQ}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='primary.main' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Answered</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800, color: 'primary.main' }}>{correctCount + incorrectCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='success.main' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Correct</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800, color: 'success.main' }}>{correctCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='error.main' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Incorrect</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800, color: 'error.main' }}>{incorrectCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='warning.main' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Not Answered Yet</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800, color: 'warning.main' }}>{totalQ - (correctCount + incorrectCount)}</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                    <Tooltip title='Reset answers'>
                      <IconButton size='small' onClick={() => void handleResetAttempt()} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                        <RefreshIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden', display: 'flex' }}>
                  <Box sx={{ width: `${(correctCount / totalQ) * 100}%`, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
                  <Box sx={{ width: `${(incorrectCount / totalQ) * 100}%`, bgcolor: 'error.main', transition: 'width 0.4s ease' }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                    {isLoggedIn ? `${progressPct}% Accuracy` : 'Accuracy Tracking'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                    {correctCount + incorrectCount} of {totalQ} questions completed
                  </Typography>
                </Box>
              </Paper>
              )}
              {isLoggedIn && attemptLoading && (
                <Box sx={{ mb: 3 }}>
                  <CircularProgress size={20} />
                </Box>
              )}

              {/* Empty subsection */}
              {activeQuestions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <QuizOutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                  <Typography>
                    {selectedSubsection === 'incorrect'
                      ? 'No incorrect answers yet — keep practising!'
                      : selectedSubsection === 'correct'
                      ? 'No correct answers yet — keep going!'
                      : 'No questions in this quiz bank.'}
                  </Typography>
                </Box>
              ) : (
                <>
                  {currentQuestion && (
                    <PracticeCard
                      question={currentQuestion}
                      questionNumber={currentPage + 1}
                      totalQuestions={activeQuestions.length}
                      selectedOptions={selectedOptions}
                      isChecked={isChecked}
                      submitting={submitting}
                      onToggleOption={handleToggleOption}
                      onCheck={() => void handleCheck()}
                      onNext={handleNext}
                      onSkip={handleSkip}
                      isLastQuestion={currentPage >= activeQuestions.length - 1}
                    />
                  )}

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <AppPagination
                        page={currentPage + 1}
                        totalPages={activeQuestions.length}
                        totalItems={activeQuestions.length}
                        pageSize={1}
                        onChange={(p) => setCurrentPage(p - 1)}
                        align='center'
                        getItemSx={(pageNo) => {
                          const qIndex = pageNo - 1;
                          const q = activeQuestions[qIndex];
                          if (!q) return {};
                          
                          const ans = courseAnswers.get(q._id);
                          const isAnswered = ans && ans.selectedOptionIndices.length > 0;
                          
                          if (isAnswered) {
                            const baseColor = ans.isCorrect ? '#22c55e' : '#ef4444';
                            const hoverColor = ans.isCorrect ? '#16a34a' : '#dc2626';
                            return {
                              bgcolor: `${baseColor} !important`,
                              color: 'white !important',
                              '&:hover': { bgcolor: `${hoverColor} !important` },
                              ...(pageNo === currentPage + 1 && {
                                border: '3px solid',
                                borderColor: 'primary.main',
                                boxShadow: '0 0 0 1px white inset',
                              })
                            };
                          }
                          return {};
                        }}
                      />
                    </Box>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* ── Column 3: Section / bank tree (right) ─────────────────── */}
        <Box
          sx={{
            width: 380,
            flexShrink: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
            bgcolor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            {selectedCourse ? (
              <>
                <Typography
                  variant='subtitle2'
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedCourse.title}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {sections.reduce((acc, s) => acc + s.banks.length, 0)} quiz bank
                  {sections.reduce((acc, s) => acc + s.banks.length, 0) !== 1 ? 's' : ''}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                  Sections
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Select a course
                </Typography>
              </>
            )}
          </Box>

          {!selectedCourseId ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 2,
                gap: 1.5,
                color: 'text.secondary',
              }}
            >
              <MenuBookOutlinedIcon sx={{ fontSize: 42, opacity: 0.18 }} />
              <Typography
                variant='body2'
                sx={{ textAlign: 'center', opacity: 0.5, fontSize: '0.82rem' }}
              >
                Select a course from the left to see its free preview quizzes.
              </Typography>
            </Box>
          ) : treeLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : sections.length === 0 ? (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <Typography variant='caption' color='text.secondary'>
                No free preview quizzes in this course.
              </Typography>
            </Box>
          ) : (
            sections.map((section) => {
              const isSectionSelected = section.banks.some((bank) => bank._id === selectedBankId);
              return (
              <Accordion
                key={section._id}
                expanded={expandedSections.includes(section._id)}
                onChange={() => toggleSection(section._id)}
                elevation={0}
                disableGutters
                sx={{
                  bgcolor: isSectionSelected ? 'primary.50' : 'transparent',
                  borderBottom: '1px solid',
                  borderColor: isSectionSelected ? 'primary.light' : 'divider',
                  borderLeft: isSectionSelected ? '3px solid' : '3px solid transparent',
                  '&::before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 2,
                    py: 0.75,
                    bgcolor: isSectionSelected ? 'rgba(25,118,210,0.1)' : 'grey.50',
                    minHeight: 44,
                  }}
                >

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontWeight: isSectionSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        lineHeight: 1.3,
                        color: isSectionSelected ? 'primary.main' : 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {section.title}
                    </Typography>
                    {section.isFreePreview && (
                      <Chip
                        label='Free'
                        size='small'
                        color='success'
                        sx={{ fontSize: '0.62rem', height: 16, flexShrink: 0 }}
                      />
                    )}
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  {section.banks.map((bank) => {
                    const isSelected = selectedBankId === bank._id;
                    const isBankExpanded = expandedBanks.includes(bank._id);
                    const bCorrect = bank.questions.filter(
                      (q) => courseAnswers.get(q._id)?.isCorrect,
                    ).length;
                    const bIncorrect = bank.questions.filter((q) => {
                      const a = courseAnswers.get(q._id);
                      return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
                    }).length;


                    return (
                      <Accordion
                        key={bank._id}
                        expanded={isBankExpanded}
                        onChange={() => toggleBank(bank._id)}
                        elevation={0}
                        disableGutters
                        sx={{
                          mb: 1.25,
                          mx: 1.5,
                          borderRadius: '8px !important',
                          border: '1.5px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? 'primary.50' : 'background.paper',
                          overflow: 'hidden',
                          '&::before': { display: 'none' },
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: isSelected ? 'primary.50' : 'rgba(0,0,0,0.01)',
                          },
                        }}
                      >



                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            px: 2,
                            py: 0.5,
                            minHeight: 0,
                            '& .MuiAccordionSummary-content': {
                              my: 1,
                              display: 'block',
                              overflow: 'hidden',
                            },
                          }}
                        >
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.82rem',
                                  lineHeight: 1.3,
                                  color: isSelected ? 'primary.main' : 'text.primary',
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {bank.title}
                              </Typography>
                              {bank.isFreePreview && !section.isFreePreview && (
                                <Chip
                                  label='Free'
                                  size='small'
                                  color='success'
                                  sx={{ fontSize: '0.6rem', height: 15, flexShrink: 0 }}
                                />
                              )}
                            </Box>
                            {/* Detailed progress when collapsed */}
                            {!isBankExpanded && (bCorrect > 0 || bIncorrect > 0) && (
                              <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: 4,
                                    bgcolor: 'action.hover',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    display: 'flex',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${(bCorrect / bank.questions.length) * 100}%`,
                                      bgcolor: 'success.main',
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      width: `${(bIncorrect / bank.questions.length) * 100}%`,
                                      bgcolor: 'error.main',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant='caption'
                                  sx={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    gap: 0.75,
                                  }}
                                >
                                  <Box component='span' sx={{ color: 'success.main' }}>
                                    C:{bCorrect}
                                  </Box>
                                  <Box component='span' sx={{ color: 'error.main' }}>
                                    W:{bIncorrect}
                                  </Box>
                                </Typography>
                              </Box>
                            )}
                          </Box>


                          {bank.description && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{
                                display: 'block',
                                mt: 0.25,
                                fontSize: '0.72rem',
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {bank.description}
                            </Typography>
                          )}
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: 2, pb: 1.25, pt: 0 }}>
                          <Stack sx={{ gap: 0.75 }}>
                            <SubsectionProgressButton
                              label='All'
                              count={bank.questions.length}
                              total={bank.questions.length}
                              correct={bCorrect}
                              incorrect={bIncorrect}
                              progressValue={bCorrect + bIncorrect}
                              progressText={`${bCorrect + bIncorrect}/${bank.questions.length} answered`}
                              color='primary'
                              selected={isSelected && selectedSubsection === 'all'}
                              onClick={() => handleSelectBank(bank._id, 'all')}
                            />
                            <SubsectionProgressButton
                              label='Wrong'
                              count={bIncorrect}
                              total={bank.questions.length}
                              correct={bCorrect}
                              incorrect={bIncorrect}
                              progressValue={bIncorrect}
                              progressText={`${bIncorrect}/${bank.questions.length} wrong`}
                              color='error'
                              selected={isSelected && selectedSubsection === 'incorrect'}
                              onClick={() => handleSelectBank(bank._id, 'incorrect')}
                            />
                            <SubsectionProgressButton
                              label='Correct'
                              count={bCorrect}
                              total={bank.questions.length}
                              correct={bCorrect}
                              incorrect={bIncorrect}
                              progressValue={bCorrect}
                              progressText={`${bCorrect}/${bank.questions.length} correct`}
                              color='success'
                              selected={isSelected && selectedSubsection === 'correct'}
                              onClick={() => handleSelectBank(bank._id, 'correct')}
                            />
                          </Stack>
                        </AccordionDetails>


                      </Accordion>
                    );
                  })}

                </AccordionDetails>
              </Accordion>
              );
            })
          )}

          {/* Buy card — shown when there are locked banks */}
        </Box>
      </Box>
    </Box>
  );
}

// ── Practice card ──────────────────────────────────────────────────────────

function SubsectionProgressButton({
  label,
  count,
  total,
  correct,
  incorrect,
  progressValue,
  progressText,
  color,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  total: number;
  correct: number;
  incorrect: number;
  progressValue: number;
  progressText: string;
  color: 'primary' | 'success' | 'error';
  selected: boolean;
  onClick: () => void;
}) {


  const percent = total > 0 ? Math.round((progressValue / total) * 100) : 0;
  const selectedBg =
    color === 'error'
      ? 'rgba(239,68,68,0.08)'
      : color === 'success'
      ? 'rgba(34,197,94,0.08)'
      : 'rgba(25,118,210,0.08)';

  return (
    <Button
      fullWidth
      onClick={onClick}
      color={color}
      variant='text'
      sx={{
        justifyContent: 'stretch',
        p: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: selected ? `${color}.main` : 'divider',
        bgcolor: selected ? selectedBg : 'background.default',
        textTransform: 'none',
        color: 'text.primary',
        '&:hover': {
          bgcolor: selected ? selectedBg : 'action.hover',
          borderColor: `${color}.main`,
        },
      }}
    >
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.76rem', fontWeight: selected ? 900 : 700, flex: 1, textAlign: 'left' }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: `${color}.main` }}>
            {count}
          </Typography>
        </Box>
        <LinearProgress
          variant='determinate'
          value={percent}
          color={color}
          sx={{ height: 5, borderRadius: 5, my: 0.65, bgcolor: 'action.selected' }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
            {progressText}
          </Typography>
          <Typography
            variant='caption'
            sx={{ fontSize: '0.65rem', lineHeight: 1.2, color: 'text.secondary', whiteSpace: 'nowrap' }}
          >
            Wrong {incorrect} / Correct {correct}
          </Typography>
        </Box>
      </Box>
    </Button>
  );
}



function PracticeCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptions,
  isChecked,
  submitting,
  onToggleOption,
  onCheck,
  onNext,
  onSkip,
  isLastQuestion,
}: {
  question: IQuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptions: number[];
  isChecked: boolean;
  submitting: boolean;
  onToggleOption: (idx: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLastQuestion: boolean;
}) {
  const isCorrectAnswer =
    isChecked && arraysEqualSorted(selectedOptions, question.correctOptionIndices);
  const multipleCorrect = question.correctOptionIndices.length > 1;

  return (
    <Paper variant='outlined' sx={{ p: 3, borderRadius: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Chip
          label={`Q ${questionNumber} of ${totalQuestions}`}
          size='small'
          sx={{ fontWeight: 700 }}
        />
        {multipleCorrect && (
          <Chip
            label='Select all that apply'
            size='small'
            color='info'
            variant='outlined'
            sx={{ fontSize: '0.7rem' }}
          />
        )}
      </Box>

      <Typography
        variant='h6'
        sx={{ fontWeight: 600, mb: 3, lineHeight: 1.55, fontSize: '1.05rem' }}
      >
        {question.question}
      </Typography>

      <Stack spacing={1.25}>
        {question.options.map((opt, idx) => {
          const isSelected = selectedOptions.includes(idx);
          const isCorrect = question.correctOptionIndices.includes(idx);

          let borderColor = 'divider';
          let bgColor = 'background.paper';
          if (isChecked) {
            if (isCorrect) { borderColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.1)'; }
            else if (isSelected) { borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.1)'; }
          } else if (isSelected) {
            borderColor = 'primary.main';
            bgColor = 'primary.50';
          }

          return (
            <Box
              key={idx}
              onClick={() => onToggleOption(idx)}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                border: '1.5px solid',
                borderColor,
                bgcolor: bgColor,
                cursor: isChecked ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                ...(!isChecked && {
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                }),
              }}
            >
              {/* Checkbox indicator */}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 0.75,
                  border: '1.5px solid',
                  mt: 0.15,
                  flexShrink: 0,
                  borderColor: isChecked
                    ? isCorrect ? '#22c55e' : isSelected ? '#ef4444' : 'divider'
                    : isSelected ? 'primary.main' : 'action.disabled',
                  bgcolor: isChecked
                    ? isCorrect ? '#22c55e' : isSelected ? '#ef4444' : 'transparent'
                    : isSelected ? 'primary.main' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(isSelected || (isChecked && isCorrect)) && (
                  <Box
                    component='span'
                    sx={{ color: 'white', fontSize: '0.65rem', fontWeight: 900, lineHeight: 1 }}
                  >
                    ✓
                  </Box>
                )}
              </Box>

              {/* Letter circle */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid',
                  flexShrink: 0,
                  borderColor: isChecked
                    ? isCorrect ? '#22c55e' : isSelected ? '#ef4444' : 'divider'
                    : isSelected ? 'primary.main' : 'action.disabled',
                  bgcolor: isChecked
                    ? isCorrect ? '#22c55e' : isSelected ? '#ef4444' : 'transparent'
                    : isSelected ? 'primary.main' : 'transparent',
                  color:
                    (isChecked && (isCorrect || isSelected)) || (!isChecked && isSelected)
                      ? 'white'
                      : 'text.secondary',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                }}
              >
                {OPTION_LABELS[idx]}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    lineHeight: 1.55,
                    color: isChecked
                      ? isCorrect ? 'success.dark' : isSelected ? 'error.dark' : 'text.secondary'
                      : isSelected ? 'primary.main' : 'text.primary',
                  }}
                >
                  {opt.text}
                </Typography>
                {isChecked && opt.explanation && (
                  <Typography
                    variant='caption'
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                      color: isCorrect
                        ? 'success.dark'
                        : isSelected
                        ? 'error.dark'
                        : 'text.secondary',
                      opacity: 0.85,
                    }}
                  >
                    {opt.explanation}
                  </Typography>
                )}
              </Box>

              {isChecked && isCorrect && (
                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main', flexShrink: 0 }} />
              )}
              {isChecked && isSelected && !isCorrect && (
                <CancelIcon sx={{ fontSize: 20, color: 'error.main', flexShrink: 0 }} />
              )}
            </Box>
          );
        })}
      </Stack>

      {isChecked && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: isCorrectAnswer ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: '1px solid',
            borderColor: isCorrectAnswer ? '#22c55e' : '#ef4444',
          }}
        >
          <Typography
            variant='body2'
            sx={{ fontWeight: 700, color: isCorrectAnswer ? 'success.dark' : 'error.dark' }}
          >
            {isCorrectAnswer
              ? '✓ Correct!'
              : '✗ Incorrect — correct answer(s) are highlighted above.'}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 2.5,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {!isChecked && (
          <Button
            variant='outlined'
            startIcon={<SkipNextIcon />}
            onClick={onSkip}
            disabled={isLastQuestion}
          >
            Skip
          </Button>
        )}
        {!isChecked ? (
          <Button
            variant='contained'
            onClick={onCheck}
            disabled={selectedOptions.length === 0 || submitting}
            endIcon={
              submitting ? <CircularProgress size={16} color='inherit' /> : undefined
            }
          >
            Check Answer
          </Button>
        ) : (
          <Button
            variant='contained'
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
            disabled={isLastQuestion}
          >
            Next
          </Button>
        )}
      </Box>
    </Paper>
  );
}
