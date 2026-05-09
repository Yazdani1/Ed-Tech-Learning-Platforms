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
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
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



  const handleResetAttempt = async (bankId?: string) => {
    const targetId = bankId ?? selectedBankId;
    if (!targetId) return;
    const targetBank = allBanks.find((b) => b._id === targetId) ?? selectedBank;
    const ok = await confirm({
      title: 'Reset Practice',
      message: 'Clear all your saved answers for this quiz bank?',
      confirmText: 'Reset',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    if (isLoggedIn) {
      await quizBankService.resetAttempt(targetId);
      if (selectedBankId === targetId) setAttempt(null);
    }
    setCourseAnswers((prev) => {
      const next = new Map(prev);
      targetBank?.questions.forEach((q) => next.delete(q._id));
      return next;
    });
    if (selectedBankId === targetId) {
      setCurrentPage(0);
      setSelectedOptions([]);
      setIsChecked(false);
    }
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
            width: 300,
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

        {/* ── Column 3: Practice panel ──────────────────────────────── */}
        <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Horizontal course info bar — shown whenever a course is selected */}
          {selectedCourseId && (
            <Box
              sx={{
                px: 2,
                py: 0.75,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
                minHeight: 56,
              }}
            >
              {/* Cover image */}
              <Box
                component='img'
                src={selectedCourse?.coverImage || 'https://via.placeholder.com/72x44?text=Course'}
                sx={{ width: 72, height: 44, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0, border: '1px solid', borderColor: 'divider' }}
              />

              {/* Course title + subtitle */}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedCourse?.title ?? 'Loading...'}
                </Typography>
                {selectedCourse?.subtitle && (
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                    {selectedCourse.subtitle}
                  </Typography>
                )}
              </Box>

              <Box sx={{ width: '1px', height: 28, bgcolor: 'divider', flexShrink: 0 }} />

              {/* Quiz bank counts */}
              <Box sx={{ flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.25 }}>
                  Quiz Banks
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {allBanks.length + lockedBankCount} total
                  </Typography>
                  {lockedBankCount > 0 && (
                    <Chip
                      label={`${lockedBankCount} locked`}
                      size='small'
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: 'error.50',
                        color: 'error.main',
                        border: '1px solid',
                        borderColor: 'error.200',
                        borderRadius: 0.5,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ width: '1px', height: 28, bgcolor: 'divider', flexShrink: 0 }} />

              {/* Total questions (accessible + locked) */}
              <Box sx={{ flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.25 }}>
                  Questions
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {courseTotalQ + lockedQuestionCount} total
                  </Typography>
                  {lockedQuestionCount > 0 && (
                    <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'error.main', whiteSpace: 'nowrap' }}>
                      ({lockedQuestionCount} locked)
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ width: '1px', height: 28, bgcolor: 'divider', flexShrink: 0 }} />

              {/* Price */}
              <Box sx={{ flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.25 }}>
                  Price
                </Typography>
                {selectedCourse?.pricing === 'Free' ? (
                  <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: 'success.main' }}>Free</Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: 'text.primary' }}>
                      ${selectedCourse?.discountPrice ?? selectedCourse?.price ?? selectedCourse?.listPrice ?? '—'}
                    </Typography>
                    {(selectedCourse?.discountPercent ?? 0) > 0 && (
                      <Chip
                        label={`-${selectedCourse?.discountPercent}%`}
                        size='small'
                        color='error'
                        sx={{ fontWeight: 900, borderRadius: 0.5, height: 16, fontSize: '0.58rem', '& .MuiChip-label': { px: 0.6 } }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {/* Unlock / View Course button */}
              <Button
                variant='contained'
                size='small'
                color={lockedBankCount > 0 ? 'warning' : 'primary'}
                component={RouterLink}
                to={`/courses/${selectedCourseId}`}
                startIcon={lockedBankCount > 0
                  ? <LockOutlinedIcon sx={{ fontSize: '14px !important' }} />
                  : <LockOpenOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ fontWeight: 800, borderRadius: 0.5, textTransform: 'none', fontSize: '0.78rem', py: 0.5, px: 1.5, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {lockedBankCount > 0 ? 'Unlock Course' : 'View Course'}
              </Button>
            </Box>
          )}

          {/* Body: progress card (auto height) + quiz content */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

            {/* Progress Stats Card — auto height, sits at top */}
            {selectedCourseId && courseTotalQ > 0 && (
              <Box
                sx={{
                  width: 148,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                {/* Course stats */}
                <Box sx={{ px: 1.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 1 }}>
                    Course
                  </Typography>
                  <Box sx={{ height: 4, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden', display: 'flex', mb: 1.25 }}>
                    <Box sx={{ width: `${(courseTotalCorrect / courseTotalQ) * 100}%`, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
                    <Box sx={{ width: `${(courseTotalIncorrect / courseTotalQ) * 100}%`, bgcolor: 'error.main', transition: 'width 0.4s ease' }} />
                  </Box>
                  {[
                    { label: 'Total', value: courseTotalQ, color: 'text.primary' },
                    { label: 'Answered', value: courseTotalAnswered, color: 'primary.main' },
                    { label: 'Correct', value: courseTotalCorrect, color: 'success.main' },
                    { label: 'Incorrect', value: courseTotalIncorrect, color: 'error.main' },
                    { label: 'Remaining', value: courseTotalRemaining, color: 'warning.main' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>{label}</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color }}>{value}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 0.75 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>Accuracy</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: 'primary.main' }}>{courseProgressPct}%</Typography>
                  </Box>
                </Box>

                {/* Bank stats */}
                {selectedBankId && selectedBank && totalQ > 0 && (
                  <Box sx={{ px: 1.5, py: 1.75 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Quiz Bank
                    </Typography>
                    <Box sx={{ height: 4, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden', display: 'flex', mb: 1.25 }}>
                      <Box sx={{ width: `${(correctCount / totalQ) * 100}%`, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
                      <Box sx={{ width: `${(incorrectCount / totalQ) * 100}%`, bgcolor: 'error.main', transition: 'width 0.4s ease' }} />
                    </Box>
                    {[
                      { label: 'Total', value: totalQ, color: 'text.primary' },
                      { label: 'Answered', value: correctCount + incorrectCount, color: 'primary.main' },
                      { label: 'Correct', value: correctCount, color: 'success.main' },
                      { label: 'Incorrect', value: incorrectCount, color: 'error.main' },
                      { label: 'Remaining', value: totalQ - (correctCount + incorrectCount), color: 'warning.main' },
                    ].map(({ label, value, color }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>{label}</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color }}>{value}</Typography>
                      </Box>
                    ))}
                    <Divider sx={{ my: 0.75 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.63rem', color: 'text.secondary' }}>Accuracy</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: 'success.main' }}>{progressPct}%</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Scrollable quiz content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
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
            <Box sx={{ p: { xs: 1.5, md: 2 }, maxWidth: 760, mx: 'auto' }}>
              {/* Bank title + subsection badge */}
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedBank?.title}
                  </Typography>
                  {selectedBank?.description && (
                    <Typography variant='body2' color='text.secondary'>
                      {selectedBank.description}
                    </Typography>
                  )}
                </Box>
                {(correctCount + incorrectCount) > 0 && (
                  <Tooltip title='Reset all answers for this quiz bank' placement='left'>
                    <IconButton
                      size='small'
                      onClick={() => void handleResetAttempt()}
                      sx={{ flexShrink: 0, mt: 0.5, color: 'text.primary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
                    >
                      <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {isLoggedIn && attemptLoading && (
                <Box sx={{ mb: 1.5 }}>
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
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant='h6' sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        component='span'
                        sx={{
                          px: 1.25,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '0.85rem',
                          fontWeight: 900,
                          color: 'white',
                          bgcolor:
                            selectedSubsection === 'all'
                              ? 'common.black'
                              : selectedSubsection === 'incorrect'
                              ? 'error.main'
                              : 'success.main',
                        }}
                      >
                        {selectedSubsection === 'all'
                          ? 'All Questions'
                          : selectedSubsection === 'incorrect'
                          ? 'Incorrect Questions'
                          : 'Correct Questions'}
                      </Box>
                      <Typography
                        component='span'
                        variant='h6'
                        sx={{ fontWeight: 800, color: 'text.secondary', ml: 0.5 }}
                      >
                        ({activeQuestions.length})
                      </Typography>
                    </Typography>
                  </Box>

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

                    <AppPagination
                      page={currentPage + 1}
                      totalPages={activeQuestions.length}
                      totalItems={activeQuestions.length}
                      pageSize={1}
                      onChange={(p) => setCurrentPage(p - 1)}
                      align='space-between'
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
                            }),
                          };
                        }
                        return {};
                      }}
                    />
                </>
              )}
            </Box>
          )}
            </Box>
          </Box>
        </Box>

        {/* ── Column 3: Section / bank tree (right) ─────────────────── */}
        <Box
          sx={{
            width: 280,
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
                          {(bCorrect + bIncorrect) > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Tooltip title='Reset progress for this quiz bank' placement='top'>
                                <IconButton
                                  size='small'
                                  onClick={(e) => { e.stopPropagation(); void handleResetAttempt(bank._id); }}
                                  sx={{ color: 'text.primary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
                                >
                                  <RefreshIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
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
    <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 0.5 }}>
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
