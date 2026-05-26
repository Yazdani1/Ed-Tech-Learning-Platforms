import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import toast from 'react-hot-toast';
import { quizBankService } from '../../services/quizBank.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
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
import PracticeQuizCourseList from './practiceQuiz/PracticeQuizCourseList';
import PracticeQuizPracticePanel from './practiceQuiz/PracticeQuizPracticePanel';
import PracticeQuizBankTree from './practiceQuiz/PracticeQuizBankTree';

export type Subsection = 'all' | 'incorrect' | 'correct';

function arraysEqualSorted(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export type LocalAnswer = { selectedOptionIndices: number[]; isCorrect: boolean };

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

const PracticeQuizPage= () => {
  const { user } = useAuth();
  const { confirm } = useConfirmModal();
  const isLoggedIn = Boolean(user);

  // ── Course list ──────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<IPublicCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseSnapshot, setSelectedCourseSnapshot] = useState<IPublicCourse | null>(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const hasCourseParam = searchParams.has('courseId');
  const hasBankParam = searchParams.has('bankId');

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

  useEffect(() => {
    const cid = searchParams.get('courseId');
    const bid = searchParams.get('bankId');
    if (cid) setSelectedCourseId(cid);
    if (bid) setSelectedBankId(bid);
  }, [searchParams]);

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
      .then((r) => {
        const fetchedCourses = r.data ?? [];
        setCourses(fetchedCourses);

        if (!hasCourseParam && fetchedCourses.length > 0) {
          setSelectedCourseId((currentCourseId) => currentCourseId ?? fetchedCourses[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, [debouncedSearch, selectedCategory, selectedCourseType, selectedPricing, hasCourseParam]);

  // Fetch section/bank tree when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setSections([]);
      setLockedBankCount(0);
      setSelectedCourseSnapshot(null);
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
        setSelectedCourseSnapshot(treeRes.data?.course ?? null);

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

        const firstSectionWithBank = fetchedSections.find((section) => section.banks.length > 0);
        const firstBank = firstSectionWithBank?.banks[0] ?? null;
        const currentBankExists = fetchedSections.some((section) =>
          section.banks.some((bank) => bank._id === selectedBankId),
        );

        // Expand and select the first quiz bank by default.
        if (fetchedSections.length > 0) {
          setExpandedSections([firstSectionWithBank?._id ?? fetchedSections[0]._id]);
          setExpandedBanks(firstBank ? [firstBank._id] : []);

          if (!hasBankParam && firstBank && !currentBankExists) {
            setSelectedBankId(firstBank._id);
            setSelectedSubsection('all');
          }
        } else {
          setExpandedSections([]);
          setExpandedBanks([]);
          if (!hasBankParam) setSelectedBankId(null);
        }
      })
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, [selectedCourseId, isLoggedIn, hasBankParam]); // eslint-disable-line react-hooks/exhaustive-deps


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

  const selectedCourse =
    courses.find((c) => c._id === selectedCourseId) ??
    (selectedCourseSnapshot?._id === selectedCourseId ? selectedCourseSnapshot : null);
  const activeFilterCount = [
    search.trim(),
    selectedCategory,
    selectedCourseType,
    selectedPricing,
  ].filter(Boolean).length;

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
        component='style'
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes sidebarTogglePulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.08); }
            }
          `,
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 68px)',
        }}
      >
        <PracticeQuizCourseList
          courses={courses}
          coursesLoading={coursesLoading}
          selectedCourseId={selectedCourseId}
          collapsed={leftSidebarCollapsed}
          onToggleCollapse={() => setLeftSidebarCollapsed((c) => !c)}
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedCourseType={selectedCourseType}
          onCourseTypeChange={setSelectedCourseType}
          selectedPricing={selectedPricing}
          onPricingChange={setSelectedPricing}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((f) => !f)}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          categories={categories}
          courseTypes={courseTypes}
          onSelectCourse={(courseId, course) => {
            setSelectedCourseId(courseId);
            setSelectedCourseSnapshot(course);
          }}
        />

        {/* ── Practice panel ── */}
        <PracticeQuizPracticePanel
          selectedCourseId={selectedCourseId}
          selectedBankId={selectedBankId}
          selectedBank={selectedBank}
          selectedCourse={selectedCourse}
          selectedSubsection={selectedSubsection}
          activeQuestions={activeQuestions}
          currentPage={currentPage}
          currentQuestion={currentQuestion}
          selectedOptions={selectedOptions}
          isChecked={isChecked}
          submitting={submitting}
          attemptLoading={attemptLoading}
          isLoggedIn={isLoggedIn}
          allBanks={allBanks}
          lockedBankCount={lockedBankCount}
          courseAnswers={courseAnswers}
          totalQ={totalQ}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          progressPct={progressPct}
          courseTotalQ={courseTotalQ}
          courseTotalCorrect={courseTotalCorrect}
          courseTotalIncorrect={courseTotalIncorrect}
          courseTotalAnswered={courseTotalAnswered}
          courseTotalRemaining={courseTotalRemaining}
          courseProgressPct={courseProgressPct}
          onSetCurrentPage={setCurrentPage}
          onToggleOption={handleToggleOption}
          onCheck={() => void handleCheck()}
          onNext={handleNext}
          onSkip={handleSkip}
          onResetAttempt={handleResetAttempt}
        />

        {/* ── Quiz bank tree ── */}
        <PracticeQuizBankTree
          selectedCourseId={selectedCourseId}
          selectedCourse={selectedCourse}
          selectedBankId={selectedBankId}
          selectedSubsection={selectedSubsection}
          sections={sections}
          treeLoading={treeLoading}
          expandedSections={expandedSections}
          expandedBanks={expandedBanks}
          courseAnswers={courseAnswers}
          collapsed={rightSidebarCollapsed}
          onToggleCollapse={() => setRightSidebarCollapsed((c) => !c)}
          onToggleSection={toggleSection}
          onToggleBank={toggleBank}
          onSelectBank={handleSelectBank}
          onResetAttempt={handleResetAttempt}
        />
      </Box>
    </Box>
  );
};

export default PracticeQuizPage;
