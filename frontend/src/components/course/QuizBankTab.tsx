import { useState, useEffect, useRef } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Pagination,
  PaginationItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Avatar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import RefreshIcon from '@mui/icons-material/Refresh';
import toast from 'react-hot-toast';
import { quizBankService } from '../../services/quizBank.service';
import { quizSectionService } from '../../services/quizSection.service';
import type {
  IQuizSection,
  IQuizBank,
  IQuizAttempt,
  IQuizQuestion,
} from '../../types/index';
import ItemActionMenu from '../common/ItemActionMenu';
import { useConfirmModal } from '../../context/ConfirmModalContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

type Subsection = 'all' | 'incorrect' | 'correct';

interface Props {
  courseId: string;
  canPost: boolean;
  userId: string;
}

type QFormState = {
  question: string;
  options: { text: string; explanation: string }[];
  correctOptionIndices: number[];
};

interface LocalAnswer {
  selectedOptionIndices: number[];
  isCorrect: boolean;
}

const blankQForm = (): QFormState => ({
  question: '',
  options: [
    { text: '', explanation: '' },
    { text: '', explanation: '' },
    { text: '', explanation: '' },
    { text: '', explanation: '' },
  ],
  correctOptionIndices: [],
});

function arraysEqualSorted(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export default function QuizBankTab({ courseId, canPost, userId: _userId }: Props) {
  const { confirm } = useConfirmModal();

  const [quizSections, setQuizSections] = useState<IQuizSection[]>([]);
  const [quizBanks, setQuizBanks] = useState<IQuizBank[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<Subsection>('all');
  const [managingBankId, setManagingBankId] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<IQuizAttempt | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const attemptRef = useRef<IQuizAttempt | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [courseAnswers, setCourseAnswers] = useState<Map<string, LocalAnswer>>(new Map());

  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedBanks, setExpandedBanks] = useState<string[]>([]);

  const [showCreateSection, setShowCreateSection] = useState(false);
  const [createSecForm, setCreateSecForm] = useState({ title: '' });
  const [creatingSec, setCreatingSec] = useState(false);

  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [editSecForm, setEditSecForm] = useState({ title: '' });
  const [editingSecLoading, setEditingSecLoading] = useState(false);

  const [createBankSectionId, setCreateBankSectionId] = useState<string | null>(null);
  const [createBankForm, setCreateBankForm] = useState({ title: '', description: '' });
  const [creatingBank, setCreatingBank] = useState(false);

  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editBankForm, setEditBankForm] = useState({ title: '', description: '' });
  const [editingBankLoading, setEditingBankLoading] = useState(false);

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qForm, setQForm] = useState<QFormState>(blankQForm);
  const [addingQ, setAddingQ] = useState(false);

  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editQForm, setEditQForm] = useState<QFormState>(blankQForm);
  const [editingQLoading, setEditingQLoading] = useState(false);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      quizSectionService.getByCourse(courseId),
      quizBankService.getByCourse(courseId),
      quizBankService.getCourseAttempts(courseId),
    ])
      .then(([secRes, bankRes, attemptRes]) => {
        const fetchedSections = secRes.data ?? [];
        const fetchedBanks = bankRes.data ?? [];
        const fetchedAttempts = attemptRes.data ?? [];
        
        setQuizSections(fetchedSections);
        setQuizBanks(fetchedBanks);

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

        if (fetchedSections.length > 0) {
          setExpandedSections([fetchedSections[0]._id]);
          const firstSectionBanks = fetchedBanks.filter((b) => b.quizSection === fetchedSections[0]._id);
          if (firstSectionBanks.length > 0) {
            setExpandedBanks([firstSectionBanks[0]._id]);
            setSelectedBankId(firstSectionBanks[0]._id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (!selectedBankId) { setAttempt(null); return; }
    setAttemptLoading(true);
    quizBankService
      .getMyAttempt(selectedBankId)
      .then((r) => setAttempt(r.data ?? null))
      .catch(() => {})
      .finally(() => setAttemptLoading(false));
  }, [selectedBankId]);

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

  useEffect(() => {
    setCurrentPage(0);
    setSelectedOptions([]);
    setIsChecked(false);
  }, [selectedBankId, selectedSubsection]);

  useEffect(() => {
    const bank = quizBanks.find((b) => b._id === selectedBankId);
    if (!bank) return;
    const activeQs = getFilteredQuestions(bank, selectedSubsection);
    const q = activeQs[currentPage];
    if (!q) return;

    if (selectedSubsection === 'all') {
      const existing = courseAnswers.get(q._id);
      if (existing && existing.selectedOptionIndices.length > 0) {
        setSelectedOptions(existing.selectedOptionIndices);
        setIsChecked(true);
        return;
      }
    }

    setSelectedOptions([]);
    setIsChecked(false);
  }, [currentPage, selectedBankId, selectedSubsection]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBank = quizBanks.find((b) => b._id === selectedBankId) ?? null;
  const managingBank = quizBanks.find((b) => b._id === managingBankId) ?? null;

  function getFilteredQuestions(bank: IQuizBank, sub: Subsection) {
    if (sub === 'all') return bank.questions;
    if (sub === 'incorrect')
      return bank.questions.filter((q) => {
        const a = courseAnswers.get(q._id);
        return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
      });
    return bank.questions.filter((q) => courseAnswers.get(q._id)?.isCorrect === true);
  };

  const activeQuestions = selectedBank
    ? getFilteredQuestions(selectedBank, selectedSubsection)
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

  const handleSelectBank = (bankId: string, sub: Subsection) => {
    setSelectedBankId(bankId);
    setSelectedSubsection(sub);
    setManagingBankId(null);
    const bank = quizBanks.find(b => b._id === bankId);
    if (bank) {
      if (!expandedSections.includes(bank.quizSection!)) setExpandedSections(prev => [...prev, bank.quizSection!]);
      if (!expandedBanks.includes(bankId)) setExpandedBanks(prev => [...prev, bankId]);
    }
  };

  const handleManage = (bankId: string) => {
    setManagingBankId(bankId);
    setSelectedBankId(null);
    setShowAddQuestion(false);
    setEditingQId(null);
    setEditingBankId(null);
  };

  const handleCheck = async () => {
    if (!currentQuestion || selectedOptions.length === 0 || !selectedBankId) return;
    setSubmitting(true);
    try {
      const res = await quizBankService.submitAnswer(selectedBankId, {
        questionId: currentQuestion._id,
        selectedOptionIndices: selectedOptions,
      });
      const updatedAttempt = res.data ?? null;
      setAttempt(updatedAttempt);
      setCourseAnswers(prev => {
        const next = new Map(prev);
        const ans = updatedAttempt?.answers.find(a => a.questionId === currentQuestion._id);
        next.set(currentQuestion._id, { selectedOptionIndices: selectedOptions, isCorrect: ans?.isCorrect ?? false });
        return next;
      });
      setIsChecked(true);
    } catch {} finally { setSubmitting(false); }
  };

  const handleNext = () => { if (currentPage < activeQuestions.length - 1) setCurrentPage((p) => p + 1); };
  const handleSkip = () => { if (currentPage < activeQuestions.length - 1) setCurrentPage((p) => p + 1); };
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => { setCurrentPage(page - 1); setSelectedOptions([]); setIsChecked(false); };
  const handleToggleOption = (idx: number) => { if (isChecked) return; setSelectedOptions((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]); };

  const handleResetAttempt = async () => {
    if (!selectedBankId) return;
    const ok = await confirm({ title: 'Reset Practice', message: 'Clear all your answers for this quiz bank?', confirmText: 'Reset', cancelText: 'Cancel' });
    if (!ok) return;
    await quizBankService.resetAttempt(selectedBankId);
    setAttempt(null);
    setCourseAnswers(prev => {
      const next = new Map(prev);
      selectedBank?.questions.forEach(q => next.delete(q._id));
      return next;
    });
    setCurrentPage(0);
    setSelectedOptions([]);
    setIsChecked(false);
    toast.success('Practice reset');
  };

  const handleCreateSection = async () => {
    if (!createSecForm.title.trim()) { toast.error('Title is required'); return; }
    setCreatingSec(true);
    try {
      const res = await quizSectionService.create({ course: courseId, title: createSecForm.title.trim() });
      if (res.data) setQuizSections((p) => [...p, res.data!]);
      setCreateSecForm({ title: '' });
      setShowCreateSection(false);
      toast.success('Section created');
    } catch {} finally { setCreatingSec(false); }
  };

  const handleUpdateSection = async () => {
    if (!editingSecId) return;
    setEditingSecLoading(true);
    try {
      const res = await quizSectionService.update(editingSecId, { title: editSecForm.title.trim() });
      if (res.data) setQuizSections((p) => p.map((s) => (s._id === editingSecId ? res.data! : s)));
      setEditingSecId(null);
      toast.success('Section updated');
    } catch {} finally { setEditingSecLoading(false); }
  };

  const handleDeleteSection = async (secId: string) => {
    const ok = await confirm({ title: 'Delete Quiz Section', message: 'Delete this section and all quiz banks inside it?', confirmText: 'Delete' });
    if (!ok) return;
    await quizSectionService.delete(secId);
    setQuizSections((p) => p.filter((s) => s._id !== secId));
    setQuizBanks((p) => p.filter((b) => b.quizSection !== secId));
    toast.success('Section deleted');
  };

  const handleCreateBank = async (sectionId: string) => {
    if (!createBankForm.title.trim()) { toast.error('Title is required'); return; }
    setCreatingBank(true);
    try {
      const res = await quizBankService.create({ course: courseId, quizSection: sectionId, title: createBankForm.title.trim(), description: createBankForm.description.trim() || undefined });
      if (res.data) setQuizBanks((p) => [...p, res.data!]);
      setCreateBankForm({ title: '', description: '' });
      setCreateBankSectionId(null);
      toast.success('Quiz bank created');
    } catch {} finally { setCreatingBank(false); }
  };

  const handleDeleteBank = async (bankId: string) => {
    const ok = await confirm({ title: 'Delete Quiz Bank', message: 'Delete this quiz bank and all student attempts?', confirmText: 'Delete' });
    if (!ok) return;
    await quizBankService.delete(bankId);
    setQuizBanks((p) => p.filter((b) => b._id !== bankId));
    if (selectedBankId === bankId) setSelectedBankId(null);
    toast.success('Quiz bank deleted');
  };

  const handleUpdateBank = async () => {
    if (!editingBankId) return;
    setEditingBankLoading(true);
    try {
      const res = await quizBankService.update(editingBankId, editBankForm);
      if (res.data) setQuizBanks((p) => p.map((b) => (b._id === editingBankId ? res.data! : b)));
      setEditingBankId(null);
      toast.success('Updated');
    } catch {} finally { setEditingBankLoading(false); }
  };

  const handleAddQuestion = async () => {
    if (!managingBankId) return;
    if (!qForm.question.trim()) { toast.error('Question text is required'); return; }
    if (qForm.options.some((o) => !o.text.trim())) { toast.error('All 4 options are required'); return; }
    if (qForm.correctOptionIndices.length === 0) { toast.error('Select at least one correct answer'); return; }
    setAddingQ(true);
    try {
      const res = await quizBankService.addQuestion(managingBankId, {
        question: qForm.question.trim(),
        options: qForm.options.map((o) => ({ text: o.text.trim(), explanation: o.explanation.trim() || undefined })),
        correctOptionIndices: qForm.correctOptionIndices,
      });
      if (res.data) setQuizBanks((p) => p.map((b) => (b._id === managingBankId ? res.data! : b)));
      setQForm(blankQForm());
      setShowAddQuestion(false);
      toast.success('Question added');
    } catch {} finally { setAddingQ(false); }
  };

  const handleUpdateQuestion = async () => {
    if (!managingBankId || !editingQId) return;
    setEditingQLoading(true);
    try {
      const res = await quizBankService.updateQuestion(managingBankId, editingQId, {
        question: editQForm.question.trim(),
        options: editQForm.options.map((o) => ({ text: o.text.trim(), explanation: o.explanation.trim() || undefined })),
        correctOptionIndices: editQForm.correctOptionIndices,
      });
      if (res.data) setQuizBanks((p) => p.map((b) => (b._id === managingBankId ? res.data! : b)));
      setEditingQId(null);
      toast.success('Question updated');
    } catch {} finally { setEditingQLoading(false); }
  };

  const handleDeleteQuestion = async (bankId: string, qId: string) => {
    const ok = await confirm({ title: 'Delete Question', message: 'Delete this question?', confirmText: 'Delete' });
    if (!ok) return;
    const res = await quizBankService.deleteQuestion(bankId, qId);
    if (res.data) setQuizBanks((p) => p.map((b) => (b._id === bankId ? res.data! : b)));
    toast.success('Question deleted');
  };

  const toggleSection = (id: string) => setExpandedSections((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const toggleBank = (id: string) => setExpandedBanks((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={28} /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0, order: 1 }}>
        {!selectedBankId && !managingBankId && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', gap: 2, p: 4 }}>
            <QuizOutlinedIcon sx={{ fontSize: 72, opacity: 0.18 }} />
            <Typography variant='h6' sx={{ fontWeight: 600, opacity: 0.4 }}>
              {canPost ? 'Select a quiz bank to manage' : 'Select a quiz bank to start practising'}
            </Typography>
          </Box>
        )}

        {selectedBank && !managingBankId && (
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 740, mx: 'auto' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>{selectedBank.title}</Typography>
              {selectedBank.description && <Typography variant='body2' color='text.secondary'>{selectedBank.description}</Typography>}
              <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
                <Chip size='small' label={selectedSubsection === 'all' ? 'All Questions' : selectedSubsection === 'incorrect' ? 'Incorrect' : 'Correct'} color={selectedSubsection === 'all' ? 'default' : selectedSubsection === 'incorrect' ? 'error' : 'success'} sx={{ fontWeight: 700 }} />
                <Chip size='small' label={`${activeQuestions.length} questions`} variant='outlined' />
              </Stack>
            </Box>

            {attemptLoading ? <Box sx={{ mb: 3 }}><CircularProgress size={20} /></Box> : (
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
                    <Typography variant='caption' color='warning.main' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Remaining</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 800, color: 'warning.main' }}>{totalQ - (correctCount + incorrectCount)}</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
                    <Tooltip title='Reset all answers'>
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
                    {progressPct}% Accuracy
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                    {correctCount + incorrectCount} of {totalQ} questions completed
                  </Typography>
                </Box>
              </Paper>
            )}

            {activeQuestions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <QuizOutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                <Typography>No questions found in this category.</Typography>
              </Box>
            ) : (
              <>
                {currentQuestion && (
                  <QuestionPracticeCard
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
                {activeQuestions.length > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                    <Pagination
                      count={activeQuestions.length}
                      page={currentPage + 1}
                      onChange={handlePageChange}
                      size='small'
                      siblingCount={3}
                      renderItem={(item) => {
                        if (item.type !== 'page' || typeof item.page !== 'number') return <PaginationItem {...item} />;
                        const qIndex = item.page - 1;
                        const q = activeQuestions[qIndex];
                        if (!q) return <PaginationItem {...item} />;
                        
                        const ans = courseAnswers.get(q._id);
                        const isAnswered = ans && ans.selectedOptionIndices.length > 0;
                        
                        let finalSx: any = { 
                          fontWeight: 800,
                          transition: 'all 0.2s ease',
                        };

                        if (isAnswered) {
                          const baseColor = ans.isCorrect ? '#22c55e' : '#ef4444';
                          const hoverColor = ans.isCorrect ? '#16a34a' : '#dc2626';
                          finalSx = {
                            ...finalSx,
                            bgcolor: `${baseColor} !important`,
                            color: 'white !important',
                            '&:hover': { bgcolor: `${hoverColor} !important` },
                            '&.Mui-selected': { 
                              bgcolor: `${baseColor} !important`,
                              border: '3px solid',
                              borderColor: 'primary.main',
                              boxShadow: '0 0 0 1px white inset',
                            }
                          };
                        } else if (item.selected) {
                          finalSx = {
                            ...finalSx,
                            bgcolor: 'primary.main !important',
                            color: 'white !important',
                            border: '3px solid',
                            borderColor: 'primary.main',
                            boxShadow: '0 0 0 1px white inset',
                          };
                        }

                        return <PaginationItem {...item} sx={finalSx} />;
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {managingBank && canPost && (
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 740, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant='h5' sx={{ fontWeight: 700 }}>{managingBank.title}</Typography>
                {managingBank.description && <Typography variant='body2' color='text.secondary'>{managingBank.description}</Typography>}
              </Box>
              <Stack direction='row' spacing={1}>
                <Button size='small' variant='outlined' onClick={() => { setEditingBankId(managingBank._id); setEditBankForm({ title: managingBank.title, description: managingBank.description ?? '' }); }}>Edit Bank</Button>
                <Button size='small' variant='contained' onClick={() => setShowAddQuestion(true)}>Add Question</Button>
              </Stack>
            </Box>
            <Collapse in={showAddQuestion}><QuestionFormPanel form={qForm} onChange={setQForm} onSubmit={() => void handleAddQuestion()} onCancel={() => { setShowAddQuestion(false); setQForm(blankQForm()); }} submitting={addingQ} submitLabel='Add Question' /></Collapse>
            <Stack spacing={1.5}>
              {managingBank.questions.map((q, qi) => (
                <Paper key={q._id} variant='outlined' sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>{qi + 1}. {q.question}</Typography>
                    <ItemActionMenu actions={[
                      { label: 'Edit', onClick: () => { setEditingQId(q._id); setEditQForm({ question: q.question, options: q.options.map(o => ({ text: o.text, explanation: o.explanation ?? '' })), correctOptionIndices: q.correctOptionIndices }); } },
                      { label: 'Delete', color: 'error', onClick: () => void handleDeleteQuestion(managingBank._id, q._id) }
                    ]} />
                  </Box>
                  <Stack spacing={0.5} sx={{ pl: 2 }}>
                    {q.options.map((opt, oi) => (
                      <Box key={oi} sx={{ p: 0.75, borderRadius: 0.5, bgcolor: q.correctOptionIndices.includes(oi) ? 'rgba(34,197,94,0.1)' : 'transparent', border: '1px solid', borderColor: q.correctOptionIndices.includes(oi) ? 'success.main' : 'divider' }}>
                        <Typography variant='caption'>{OPTION_LABELS[oi]}. {opt.text}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* ── Right panel: Navigation Tree ─────────────────────────────────── */}
      <Box sx={{ width: 320, borderLeft: '1px solid', borderColor: 'divider', overflow: 'auto', flexShrink: 0, bgcolor: 'grey.50', order: 2 }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>Practice Quiz</Typography>
            <Typography variant='caption' color='text.secondary'>{quizSections.length} sections</Typography>
          </Box>
          {canPost && <IconButton size='small' onClick={() => setShowCreateSection(true)}><AddIcon fontSize='small' /></IconButton>}
        </Box>

        {canPost && showCreateSection && (
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <TextField label='Title' value={createSecForm.title} onChange={e => setCreateSecForm({ title: e.target.value })} fullWidth size='small' sx={{ mb: 1 }} />
            <Stack direction='row' spacing={1}><Button size='small' onClick={() => setShowCreateSection(false)}>Cancel</Button><Button size='small' variant='contained' onClick={() => void handleCreateSection()}>Create</Button></Stack>
          </Box>
        )}

        <Box sx={{ py: 1 }}>
          {quizSections.map((section) => {
            const banks = quizBanks.filter(b => b.quizSection === section._id);
            const isSectionActive = banks.some(b => b._id === selectedBankId || b._id === managingBankId);
            const isExpanded = expandedSections.includes(section._id);
            return (
              <Accordion key={section._id} expanded={isExpanded} onChange={() => toggleSection(section._id)} elevation={0} disableGutters sx={{ bgcolor: isSectionActive ? 'primary.50' : 'transparent', borderBottom: '1px solid', borderColor: 'divider', '&::before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ px: 2, bgcolor: isSectionActive ? 'rgba(25,118,210,0.05)' : 'grey.100' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{section.title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {banks.map((bank) => {
                    const isSelected = selectedBankId === bank._id || managingBankId === bank._id;
                    const isBankExpanded = expandedBanks.includes(bank._id);
                    const bCorrect = bank.questions.filter(q => courseAnswers.get(q._id)?.isCorrect).length;
                    const bIncorrect = bank.questions.filter(q => { const a = courseAnswers.get(q._id); return a && a.selectedOptionIndices.length > 0 && !a.isCorrect; }).length;

                    return (
                      <Accordion key={bank._id} expanded={isBankExpanded} onChange={() => toggleBank(bank._id)} elevation={0} disableGutters sx={{ mb: 1, mx: 1.5, mt: 1, borderRadius: '8px !important', border: '1.5px solid', borderColor: isSelected ? 'primary.main' : 'divider', bgcolor: 'background.paper', overflow: 'hidden', '&::before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ px: 2, py: 0.5 }}>
                          <Box sx={{ width: '100%' }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{bank.title}</Typography>
                            {!isBankExpanded && (bCorrect > 0 || bIncorrect > 0) && (
                              <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Box sx={{ flex: 1, height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                                  <Box sx={{ width: `${(bCorrect / bank.questions.length) * 100}%`, bgcolor: 'success.main' }} />
                                  <Box sx={{ width: `${(bIncorrect / bank.questions.length) * 100}%`, bgcolor: 'error.main' }} />
                                </Box>
                                <Typography variant='caption' sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', display: 'flex', gap: 0.75 }}>
                                  <Box component='span' sx={{ color: 'success.main' }}>C:{bCorrect}</Box>
                                  <Box component='span' sx={{ color: 'error.main' }}>W:{bIncorrect}</Box>
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 2, pb: 1.25, pt: 0 }}>
                          <Stack spacing={0.75}>
                            {canPost && <Button size='small' variant='outlined' color='warning' fullWidth onClick={() => handleManage(bank._id)} sx={{ mb: 1.5, fontSize: '0.7rem' }}>Manage Bank</Button>}
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
                  {canPost && <Box sx={{ p: 1, textAlign: 'center' }}><Button size='small' startIcon={<AddIcon />} onClick={() => setCreateBankSectionId(section._id)}>Add Bank</Button></Box>}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

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

function QuestionPracticeCard({
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
}: any) {
  const isCorrectAnswer = isChecked && arraysEqualSorted(selectedOptions, question.correctOptionIndices);
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
        {question.options.map((opt: any, idx: number) => {
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
          >
            Check Answer
          </Button>
        ) : (
          <Button
            variant='contained'
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
            disabled={isLastQuestion}
            sx={{
              bgcolor: 'primary.main',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
            }}
          >
            Next
          </Button>
        )}
      </Box>
    </Paper>
  );
}

function QuestionFormPanel({ form, onChange, onSubmit, onCancel, submitting, submitLabel }: any) {
  const toggleCorrect = (idx: number) => { onChange((p: any) => ({ ...p, correctOptionIndices: p.correctOptionIndices.includes(idx) ? p.correctOptionIndices.filter((i: any) => i !== idx) : [...p.correctOptionIndices, idx] })); };
  return (
    <Paper variant='outlined' sx={{ p: 2.5, mb: 2.5 }}>
      <TextField label='Question text' value={form.question} onChange={e => onChange((p: any) => ({ ...p, question: e.target.value }))} fullWidth size='small' multiline minRows={2} sx={{ mb: 2 }} />
      {form.options.map((opt: any, idx: number) => (
        <Box key={idx} sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Checkbox checked={form.correctOptionIndices.includes(idx)} onChange={() => toggleCorrect(idx)} color='success' />
          <TextField label={`Option ${OPTION_LABELS[idx]}`} value={opt.text} onChange={e => onChange((p: any) => ({ ...p, options: p.options.map((o: any, i: number) => i === idx ? { ...o, text: e.target.value } : o) }))} fullWidth size='small' />
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}><Button size='small' onClick={onCancel}>Cancel</Button><Button size='small' variant='contained' onClick={onSubmit} disabled={submitting}>{submitting ? <CircularProgress size={14} /> : submitLabel}</Button></Box>
    </Paper>
  );
}
