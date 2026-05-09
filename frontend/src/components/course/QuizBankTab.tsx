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
	Switch,
	TextField,
	Tooltip,
	Typography,
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
type LocalAnswer = { selectedOptionIndices: number[]; isCorrect: boolean };

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

export default function QuizBankTab({
	courseId,
	canPost,
	userId: _userId,
}: Props) {
	const { confirm } = useConfirmModal();

	const [quizSections, setQuizSections] = useState<IQuizSection[]>([]);
	const [quizBanks, setQuizBanks] = useState<IQuizBank[]>([]);
	const [loading, setLoading] = useState(true);

	const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
	const [selectedSubsection, setSelectedSubsection] =
		useState<Subsection>('all');
	const [managingBankId, setManagingBankId] = useState<string | null>(null);

	const [attempt, setAttempt] = useState<IQuizAttempt | null>(null);
	const [attemptLoading, setAttemptLoading] = useState(false);
	const attemptRef = useRef<IQuizAttempt | null>(null);

	const [courseAnswers, setCourseAnswers] = useState<Map<string, LocalAnswer>>(new Map());
	const courseAnswersRef = useRef<Map<string, LocalAnswer>>(new Map());
	const [expandedSections, setExpandedSections] = useState<string[]>([]);
	const [expandedBanks, setExpandedBanks] = useState<string[]>([]);

	const [currentPage, setCurrentPage] = useState(0);
	const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
	const [isChecked, setIsChecked] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Create section form
	const [showCreateSection, setShowCreateSection] = useState(false);
	const [createSecForm, setCreateSecForm] = useState({ title: '' });
	const [creatingSec, setCreatingSec] = useState(false);

	// Edit section
	const [editingSecId, setEditingSecId] = useState<string | null>(null);
	const [editSecForm, setEditSecForm] = useState({ title: '' });
	const [editingSecLoading, setEditingSecLoading] = useState(false);

	// Create bank form
	const [createBankSectionId, setCreateBankSectionId] = useState<string | null>(
		null,
	);
	const [createBankForm, setCreateBankForm] = useState({
		title: '',
		description: '',
	});
	const [creatingBank, setCreatingBank] = useState(false);

	// Edit bank form
	const [editingBankId, setEditingBankId] = useState<string | null>(null);
	const [editBankForm, setEditBankForm] = useState({
		title: '',
		description: '',
	});
	const [editingBankLoading, setEditingBankLoading] = useState(false);

	// Add question
	const [showAddQuestion, setShowAddQuestion] = useState(false);
	const [qForm, setQForm] = useState<QFormState>(blankQForm);
	const [addingQ, setAddingQ] = useState(false);

	// Edit question
	const [editingQId, setEditingQId] = useState<string | null>(null);
	const [editQForm, setEditQForm] = useState<QFormState>(blankQForm);
	const [editingQLoading, setEditingQLoading] = useState(false);

	useEffect(() => {
		attemptRef.current = attempt;
	}, [attempt]);

	useEffect(() => {
		courseAnswersRef.current = courseAnswers;
	}, [courseAnswers]);

	useEffect(() => {
		setLoading(true);
		Promise.all([
			quizSectionService.getByCourse(courseId),
			quizBankService.getByCourse(courseId),
		])
			.then(([secRes, bankRes]) => {
				const sections = secRes.data ?? [];
				const banks = bankRes.data ?? [];
				setQuizSections(sections);
				setQuizBanks(banks);
				if (!canPost && sections.length > 0) {
					setExpandedSections([sections[0]._id]);
					const firstBanks = banks.filter((b) => b.quizSection === sections[0]._id);
					if (firstBanks.length > 0) setExpandedBanks([firstBanks[0]._id]);
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [courseId]);

	useEffect(() => {
		if (!selectedBankId) {
			setAttempt(null);
			return;
		}
		setAttemptLoading(true);
		quizBankService
			.getMyAttempt(selectedBankId)
			.then((r) => setAttempt(r.data ?? null))
			.catch(() => {})
			.finally(() => setAttemptLoading(false));
	}, [selectedBankId]);

	// Load all course attempts for student sidebar progress
	useEffect(() => {
		if (canPost) return;
		quizBankService
			.getCourseAttempts(courseId)
			.then((res) => {
				const attempts = res.data ?? [];
				setCourseAnswers((prev) => {
					const next = new Map(prev);
					attempts.forEach((att) =>
						att.answers.forEach((ans) => {
							next.set(ans.questionId, {
								selectedOptionIndices: ans.selectedOptionIndices,
								isCorrect: ans.isCorrect,
							});
						}),
					);
					return next;
				});
			})
			.catch(() => {});
	}, [courseId, canPost]);

	// Merge loaded attempt into courseAnswers
	useEffect(() => {
		if (!attempt) return;
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
	}, [attempt]);

	// Reset practice state on bank/subsection change
	useEffect(() => {
		setCurrentPage(0);
		setSelectedOptions([]);
		setIsChecked(false);
	}, [selectedBankId, selectedSubsection]);

	// Pre-populate from existing answers when page changes — only in 'all' subsection
	useEffect(() => {
		if (selectedSubsection !== 'all') {
			setSelectedOptions([]);
			setIsChecked(false);
			return;
		}
		const bank = quizBanks.find((b) => b._id === selectedBankId);
		if (!bank) return;
		const qs = getSubsectionQuestions(bank, courseAnswersRef.current, 'all');
		const q = qs[currentPage];
		if (!q) return;
		const existing = courseAnswersRef.current.get(q._id);
		if (existing && existing.selectedOptionIndices.length > 0) {
			setSelectedOptions(existing.selectedOptionIndices);
			setIsChecked(true);
		} else {
			setSelectedOptions([]);
			setIsChecked(false);
		}
	}, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

	const selectedBank = quizBanks.find((b) => b._id === selectedBankId) ?? null;
	const managingBank = quizBanks.find((b) => b._id === managingBankId) ?? null;
	const activeQuestions = selectedBank
		? getSubsectionQuestions(selectedBank, courseAnswers, selectedSubsection)
		: [];
	const currentQuestion = activeQuestions[currentPage] ?? null;

	const totalQ = selectedBank?.questions.length ?? 0;
	const correctCount =
		selectedBank?.questions.filter((q) => courseAnswers.get(q._id)?.isCorrect)
			.length ?? 0;
	const incorrectCount =
		selectedBank?.questions.filter((q) => {
			const a = courseAnswers.get(q._id);
			return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
		}).length ?? 0;
	const progressPct =
		totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleSelectBank = (bankId: string, sub: Subsection) => {
		setSelectedBankId(bankId);
		setSelectedSubsection(sub);
		setManagingBankId(null);
		if (!expandedBanks.includes(bankId)) {
			setExpandedBanks((prev) => [...prev, bankId]);
		}
	};

	const toggleSection = (id: string) =>
		setExpandedSections((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);

	const toggleBank = (id: string) =>
		setExpandedBanks((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);

	const handleManage = (bankId: string) => {
		setManagingBankId(bankId);
		setSelectedBankId(null);
		setShowAddQuestion(false);
		setEditingQId(null);
		setEditingBankId(null);
	};

	const handleCheck = async () => {
		if (!currentQuestion || selectedOptions.length === 0 || !selectedBankId)
			return;
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

	const handleToggleOption = (idx: number) => {
		if (isChecked) return;
		setSelectedOptions((prev) =>
			prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
		);
	};

	const handleResetAttempt = async () => {
		if (!selectedBankId) return;
		const ok = await confirm({
			title: 'Reset Practice',
			message: 'Clear all your answers for this quiz bank?',
			confirmText: 'Reset',
			cancelText: 'Cancel',
		});
		if (!ok) return;
		await quizBankService.resetAttempt(selectedBankId);
		setAttempt(null);
		setCourseAnswers((prev) => {
			const next = new Map(prev);
			selectedBank?.questions.forEach((q) => next.delete(q._id));
			return next;
		});
		setCurrentPage(0);
		setSelectedOptions([]);
		setIsChecked(false);
		toast.success('Practice reset');
	};

	// Free preview toggles
	const handleToggleSectionPreview = async (
		secId: string,
		current: boolean,
	) => {
		try {
			const res = await quizSectionService.update(secId, {
				isFreePreview: !current,
			});
			if (res.data)
				setQuizSections((p) => p.map((s) => (s._id === secId ? res.data! : s)));
			toast.success(
				!current ? 'Section set to Free Preview' : 'Free Preview removed',
			);
		} catch {
			// handled
		}
	};

	const handleToggleBankPreview = async (bankId: string, current: boolean) => {
		try {
			const res = await quizBankService.update(bankId, {
				isFreePreview: !current,
			});
			if (res.data)
				setQuizBanks((p) => p.map((b) => (b._id === bankId ? res.data! : b)));
			toast.success(
				!current ? 'Quiz Bank set to Free Preview' : 'Free Preview removed',
			);
		} catch {
			// handled
		}
	};

	// Section handlers
	const handleCreateSection = async () => {
		if (!createSecForm.title.trim()) {
			toast.error('Title is required');
			return;
		}
		setCreatingSec(true);
		try {
			const res = await quizSectionService.create({
				course: courseId,
				title: createSecForm.title.trim(),
			});
			if (res.data) setQuizSections((p) => [...p, res.data!]);
			setCreateSecForm({ title: '' });
			setShowCreateSection(false);
			toast.success('Section created');
		} catch {
			// handled
		} finally {
			setCreatingSec(false);
		}
	};

	const handleUpdateSection = async () => {
		if (!editingSecId) return;
		setEditingSecLoading(true);
		try {
			const res = await quizSectionService.update(editingSecId, {
				title: editSecForm.title.trim(),
			});
			if (res.data)
				setQuizSections((p) =>
					p.map((s) => (s._id === editingSecId ? res.data! : s)),
				);
			setEditingSecId(null);
			toast.success('Section updated');
		} catch {
			// handled
		} finally {
			setEditingSecLoading(false);
		}
	};

	const handleDeleteSection = async (secId: string) => {
		const ok = await confirm({
			title: 'Delete Quiz Section',
			message: 'Delete this section and all quiz banks inside it?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!ok) return;
		await quizSectionService.delete(secId);
		setQuizSections((p) => p.filter((s) => s._id !== secId));
		setQuizBanks((p) => p.filter((b) => b.quizSection !== secId));
		if (
			selectedBankId &&
			quizBanks.find((b) => b.quizSection === secId && b._id === selectedBankId)
		)
			setSelectedBankId(null);
		if (
			managingBankId &&
			quizBanks.find((b) => b.quizSection === secId && b._id === managingBankId)
		)
			setManagingBankId(null);
		toast.success('Section deleted');
	};

	// Bank handlers
	const handleCreateBank = async (sectionId: string) => {
		if (!createBankForm.title.trim()) {
			toast.error('Title is required');
			return;
		}
		setCreatingBank(true);
		try {
			const res = await quizBankService.create({
				course: courseId,
				quizSection: sectionId,
				title: createBankForm.title.trim(),
				description: createBankForm.description.trim() || undefined,
			});
			if (res.data) setQuizBanks((p) => [...p, res.data!]);
			setCreateBankForm({ title: '', description: '' });
			setCreateBankSectionId(null);
			toast.success('Quiz bank created');
		} catch {
			// handled
		} finally {
			setCreatingBank(false);
		}
	};

	const handleDeleteBank = async (bankId: string) => {
		const ok = await confirm({
			title: 'Delete Quiz Bank',
			message: 'Delete this quiz bank and all student attempts?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!ok) return;
		await quizBankService.delete(bankId);
		setQuizBanks((p) => p.filter((b) => b._id !== bankId));
		if (selectedBankId === bankId) setSelectedBankId(null);
		if (managingBankId === bankId) setManagingBankId(null);
		toast.success('Quiz bank deleted');
	};

	const handleUpdateBank = async () => {
		if (!editingBankId) return;
		setEditingBankLoading(true);
		try {
			const res = await quizBankService.update(editingBankId, editBankForm);
			if (res.data)
				setQuizBanks((p) =>
					p.map((b) => (b._id === editingBankId ? res.data! : b)),
				);
			setEditingBankId(null);
			toast.success('Updated');
		} catch {
			// handled
		} finally {
			setEditingBankLoading(false);
		}
	};

	const handleAddQuestion = async () => {
		if (!managingBankId) return;
		if (!qForm.question.trim()) {
			toast.error('Question text is required');
			return;
		}
		if (qForm.options.some((o) => !o.text.trim())) {
			toast.error('All 4 options are required');
			return;
		}
		if (qForm.correctOptionIndices.length === 0) {
			toast.error('Select at least one correct answer');
			return;
		}
		setAddingQ(true);
		try {
			const res = await quizBankService.addQuestion(managingBankId, {
				question: qForm.question.trim(),
				options: qForm.options.map((o) => ({
					text: o.text.trim(),
					explanation: o.explanation.trim() || undefined,
				})),
				correctOptionIndices: qForm.correctOptionIndices,
			});
			if (res.data)
				setQuizBanks((p) =>
					p.map((b) => (b._id === managingBankId ? res.data! : b)),
				);
			setQForm(blankQForm());
			setShowAddQuestion(false);
			toast.success('Question added');
		} catch {
			// handled
		} finally {
			setAddingQ(false);
		}
	};

	const handleUpdateQuestion = async () => {
		if (!managingBankId || !editingQId) return;
		if (editQForm.correctOptionIndices.length === 0) {
			toast.error('Select at least one correct answer');
			return;
		}
		setEditingQLoading(true);
		try {
			const res = await quizBankService.updateQuestion(
				managingBankId,
				editingQId,
				{
					question: editQForm.question.trim(),
					options: editQForm.options.map((o) => ({
						text: o.text.trim(),
						explanation: o.explanation.trim() || undefined,
					})),
					correctOptionIndices: editQForm.correctOptionIndices,
				},
			);
			if (res.data)
				setQuizBanks((p) =>
					p.map((b) => (b._id === managingBankId ? res.data! : b)),
				);
			setEditingQId(null);
			toast.success('Question updated');
		} catch {
			// handled
		} finally {
			setEditingQLoading(false);
		}
	};

	const handleDeleteQuestion = async (bankId: string, qId: string) => {
		const ok = await confirm({
			title: 'Delete Question',
			message: 'Delete this question?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!ok) return;
		const res = await quizBankService.deleteQuestion(bankId, qId);
		if (res.data)
			setQuizBanks((p) => p.map((b) => (b._id === bankId ? res.data! : b)));
		toast.success('Question deleted');
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress size={28} />
			</Box>
		);
	}

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
			{/* ── Sidebar (left for admin, right for student) ─────────────── */}
			<Box
				sx={{
					width: canPost ? 270 : 380,
					...(canPost
						? { borderRight: '1px solid' }
						: { borderLeft: '1px solid', order: 2 }),
					borderColor: 'divider',
					overflow: 'auto',
					flexShrink: 0,
					bgcolor: 'background.paper',
				}}
			>
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
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Box>
						<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
							Quiz Bank
						</Typography>
						<Typography variant='caption' color='text.secondary'>
							{quizSections.length} section
							{quizSections.length !== 1 ? 's' : ''}
						</Typography>
					</Box>
					{canPost && (
						<Tooltip title='Add section'>
							<IconButton
								size='small'
								onClick={() => {
									setShowCreateSection((p) => !p);
									setCreateSecForm({ title: '' });
								}}
							>
								<AddIcon fontSize='small' />
							</IconButton>
						</Tooltip>
					)}
				</Box>

				{/* Create section form */}
				{canPost && showCreateSection && (
					<Box
						sx={{
							px: 2,
							py: 1.5,
							borderBottom: '1px solid',
							borderColor: 'divider',
						}}
					>
						<TextField
							label='Section title'
							value={createSecForm.title}
							onChange={(e) => setCreateSecForm({ title: e.target.value })}
							fullWidth
							size='small'
							sx={{ mb: 1 }}
							autoFocus
						/>
						<Stack direction='row' spacing={1}>
							<Button size='small' onClick={() => setShowCreateSection(false)}>
								Cancel
							</Button>
							<Button
								size='small'
								variant='contained'
								onClick={() => void handleCreateSection()}
								disabled={creatingSec}
							>
								{creatingSec ? <CircularProgress size={14} /> : 'Create'}
							</Button>
						</Stack>
					</Box>
				)}

				{quizSections.length === 0 ? (
					<Box sx={{ px: 2, py: 3 }}>
						<Typography variant='caption' color='text.secondary'>
							{canPost
								? 'No sections yet. Click + to add one.'
								: 'No quiz sections in this course yet.'}
						</Typography>
					</Box>
				) : (
					quizSections.map((section) => {
						const banks = quizBanks.filter(
							(b) => b.quizSection === section._id,
						);
						const hasActiveBank = banks.some(
							(b) => b._id === selectedBankId || b._id === managingBankId,
						);
						const isSectionExpanded = canPost
							? true
							: expandedSections.includes(section._id);
						return (
							<Accordion
								key={section._id}
								expanded={isSectionExpanded}
								onChange={canPost ? undefined : () => toggleSection(section._id)}
								elevation={0}
								disableGutters
								sx={{
									bgcolor: hasActiveBank
										? 'rgba(25,118,210,0.03)'
										: 'transparent',
									borderBottom: '1px solid',
									borderColor: hasActiveBank ? 'primary.200' : 'divider',
									...(!canPost && hasActiveBank && {
										borderLeft: '3px solid',
										borderLeftColor: 'primary.main',
									}),
									'&::before': { display: 'none' },
								}}
							>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
									sx={{
										px: 2,
										py: 0.75,
										bgcolor: hasActiveBank
											? 'rgba(25,118,210,0.09)'
											: 'grey.50',
										minHeight: 44,
									}}
								>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											width: '100%',
											pr: 0.5,
										}}
									>
										{editingSecId === section._id ? (
											<Box
												sx={{ flex: 1, mr: 1 }}
												onClick={(e) => e.stopPropagation()}
											>
												<TextField
													value={editSecForm.title}
													onChange={(e) =>
														setEditSecForm({ title: e.target.value })
													}
													size='small'
													fullWidth
													sx={{ mb: 0.5 }}
													autoFocus
													onKeyDown={(e) => {
														if (e.key === 'Enter') void handleUpdateSection();
														if (e.key === 'Escape') setEditingSecId(null);
													}}
												/>
												<Stack direction='row' spacing={0.5}>
													<Button
														size='small'
														onClick={() => setEditingSecId(null)}
														sx={{
															minWidth: 0,
															px: 1,
															py: 0.25,
															fontSize: '0.7rem',
														}}
													>
														Cancel
													</Button>
													<Button
														size='small'
														variant='contained'
														onClick={() => void handleUpdateSection()}
														disabled={editingSecLoading}
														sx={{
															minWidth: 0,
															px: 1,
															py: 0.25,
															fontSize: '0.7rem',
														}}
													>
														{editingSecLoading ? (
															<CircularProgress size={12} />
														) : (
															'Save'
														)}
													</Button>
												</Stack>
											</Box>
										) : (
											<Typography
												sx={{
													fontWeight: 600,
													fontSize: '0.82rem',
													lineHeight: 1.3,
												}}
											>
												{section.title}
											</Typography>
										)}
										{canPost && editingSecId !== section._id && (
											<Box
												onClick={(e) => e.stopPropagation()}
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 0.25,
												}}
											>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ fontSize: '0.68rem' }}
												>
													Free
												</Typography>
												<Switch
													size='small'
													checked={section.isFreePreview}
													onChange={() =>
														void handleToggleSectionPreview(
															section._id,
															section.isFreePreview,
														)
													}
													color='success'
													sx={{ transform: 'scale(0.8)', mx: -0.5 }}
												/>
												<ItemActionMenu
													actions={[
														{
															label: 'Rename',
															icon: (
																<EditOutlinedIcon
																	fontSize='small'
																	sx={{ mr: 1 }}
																/>
															),
															onClick: () => {
																setEditingSecId(section._id);
																setEditSecForm({ title: section.title });
															},
														},
														{
															label: 'Delete',
															color: 'error',
															icon: (
																<DeleteOutlinedIcon
																	fontSize='small'
																	sx={{ mr: 1 }}
																/>
															),
															onClick: () =>
																void handleDeleteSection(section._id),
														},
													]}
												/>
											</Box>
										)}
									</Box>
								</AccordionSummary>

								<AccordionDetails sx={{ p: 0 }}>
									{banks.length === 0 && !canPost && (
										<Box sx={{ px: 2, py: 1.5 }}>
											<Typography variant='caption' color='text.secondary'>
												No quiz banks yet.
											</Typography>
										</Box>
									)}

									{banks.map((bank) => {
										const isSelected = selectedBankId === bank._id;
										const isManaging = managingBankId === bank._id;

										if (!canPost) {
											// ── Student view: nested accordion + SubsectionProgressButton ──
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
														'&:hover': { borderColor: 'primary.main' },
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
															<Typography
																sx={{
																	fontWeight: 600,
																	fontSize: '0.82rem',
																	lineHeight: 1.3,
																	color: isSelected ? 'primary.main' : 'text.primary',
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																	whiteSpace: 'nowrap',
																}}
															>
																{bank.title}
															</Typography>
															{!isBankExpanded && (bCorrect > 0 || bIncorrect > 0) && (
																<Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
																	<Box sx={{ flex: 1, height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
																		<Box sx={{ width: `${(bCorrect / bank.questions.length) * 100}%`, bgcolor: 'success.main' }} />
																		<Box sx={{ width: `${(bIncorrect / bank.questions.length) * 100}%`, bgcolor: 'error.main' }} />
																	</Box>
																	<Typography variant='caption' sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', display: 'flex', gap: 0.75 }}>
																		<Box component='span' sx={{ color: 'success.main' }}>C:{bCorrect}</Box>
																		<Box component='span' sx={{ color: 'error.main' }}>W:{bIncorrect}</Box>
																	</Typography>
																</Box>
															)}
															{bank.description && (
																<Typography
																	variant='caption'
																	color='text.secondary'
																	sx={{ display: 'block', mt: 0.25, fontSize: '0.72rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
																>
																	{bank.description}
																</Typography>
															)}
														</Box>
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
										}

										// ── Admin/Teacher view: flat box with manage controls ──
										return (
											<Box
												key={bank._id}
												sx={{
													borderTop: '1px solid',
													borderColor: 'divider',
													bgcolor: isManaging
														? 'rgba(245,158,11,0.08)'
														: isSelected
															? 'primary.50'
															: 'background.paper',
												}}
											>
												<Box
													sx={{
														px: 2,
														pt: 1.25,
														pb: 0.75,
														cursor: 'pointer',
														display: 'flex',
														alignItems: 'flex-start',
														gap: 0.5,
													}}
													onClick={() => handleManage(bank._id)}
												>
													<Box sx={{ flex: 1, minWidth: 0 }}>
														<Typography
															sx={{
																fontWeight: 600,
																fontSize: '0.82rem',
																lineHeight: 1.3,
																color: isManaging
																	? 'warning.dark'
																	: isSelected
																		? 'primary.main'
																		: 'text.primary',
															}}
														>
															{bank.title}
														</Typography>
														{bank.description && (
															<Typography
																variant='caption'
																color='text.secondary'
																sx={{
																	display: 'block',
																	mt: 0.25,
																	lineHeight: 1.3,
																	fontSize: '0.72rem',
																}}
															>
																{bank.description}
															</Typography>
														)}
													</Box>

													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 0.25,
															flexShrink: 0,
															mt: 0.1,
														}}
														onClick={(e) => e.stopPropagation()}
													>
														<Typography
															variant='caption'
															color='text.secondary'
															sx={{ fontSize: '0.68rem' }}
														>
															Free
														</Typography>
														<Switch
															size='small'
															checked={bank.isFreePreview}
															onChange={() =>
																void handleToggleBankPreview(
																	bank._id,
																	bank.isFreePreview,
																)
															}
															color='success'
															sx={{ transform: 'scale(0.8)', mx: -0.5 }}
														/>
														<ItemActionMenu
															actions={[
																{
																	label: 'Edit',
																	icon: (
																		<EditOutlinedIcon
																			fontSize='small'
																			sx={{ mr: 1 }}
																		/>
																	),
																	onClick: () => {
																		setEditingBankId(bank._id);
																		setEditBankForm({
																			title: bank.title,
																			description: bank.description ?? '',
																		});
																		handleManage(bank._id);
																	},
																},
																{
																	label: 'Delete',
																	color: 'error',
																	icon: (
																		<DeleteOutlinedIcon
																			fontSize='small'
																			sx={{ mr: 1 }}
																		/>
																	),
																	onClick: () =>
																		void handleDeleteBank(bank._id),
																},
															]}
														/>
													</Box>
												</Box>
											</Box>
										);
									})}

									{/* Add quiz bank button (canPost only) */}
									{canPost && (
										<Box sx={{ px: 2, py: 1 }}>
											{createBankSectionId === section._id ? (
												<Box>
													<TextField
														label='Bank title'
														value={createBankForm.title}
														onChange={(e) =>
															setCreateBankForm((p) => ({
																...p,
																title: e.target.value,
															}))
														}
														fullWidth
														size='small'
														sx={{ mb: 1 }}
														autoFocus
													/>
													<TextField
														label='Description (optional)'
														value={createBankForm.description}
														onChange={(e) =>
															setCreateBankForm((p) => ({
																...p,
																description: e.target.value,
															}))
														}
														fullWidth
														size='small'
														multiline
														minRows={2}
														sx={{ mb: 1 }}
													/>
													<Stack direction='row' spacing={1}>
														<Button
															size='small'
															onClick={() => setCreateBankSectionId(null)}
														>
															Cancel
														</Button>
														<Button
															size='small'
															variant='contained'
															onClick={() => void handleCreateBank(section._id)}
															disabled={creatingBank}
														>
															{creatingBank ? (
																<CircularProgress size={14} />
															) : (
																'Create'
															)}
														</Button>
													</Stack>
												</Box>
											) : (
												<Button
													size='small'
													startIcon={<AddIcon />}
													onClick={() => {
														setCreateBankSectionId(section._id);
														setCreateBankForm({ title: '', description: '' });
													}}
												>
													Add Quiz Bank
												</Button>
											)}
										</Box>
									)}
								</AccordionDetails>
							</Accordion>
						);
					})
				)}
			</Box>

			{/* ── Right panel ─────────────────────────────────────────────────── */}
			<Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
				{/* Empty state */}
				{!selectedBankId && !managingBankId && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
							color: 'text.secondary',
							gap: 2,
							p: 4,
						}}
					>
						<QuizOutlinedIcon sx={{ fontSize: 72, opacity: 0.18 }} />
						<Typography variant='h6' sx={{ fontWeight: 600, opacity: 0.4 }}>
							{canPost
								? 'Select a quiz bank to manage it'
								: 'Select a quiz bank to start practising'}
						</Typography>
						{canPost && (
							<Typography variant='body2' sx={{ opacity: 0.4 }}>
								Click <strong>+</strong> to add a section, then click a quiz
								bank to manage it.
							</Typography>
						)}
					</Box>
				)}

				{/* ── Practice mode (student) ─────────────────────────────────── */}
				{selectedBank && !managingBankId && (
					<Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 740, mx: 'auto' }}>
						{/* Header */}
						<Box sx={{ mb: 3 }}>
							<Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
								{selectedBank.title}
							</Typography>
							{selectedBank.description && (
								<Typography variant='body2' color='text.secondary'>
									{selectedBank.description}
								</Typography>
							)}
							<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
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

						{/* Progress */}
						{attemptLoading ? (
							<Box sx={{ mb: 3 }}>
								<CircularProgress size={20} />
							</Box>
						) : (
							<Paper variant='outlined' sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
								<Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, mb: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
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
										{progressPct}% Accuracy
									</Typography>
									<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
										{correctCount + incorrectCount} of {totalQ} questions completed
									</Typography>
								</Box>
							</Paper>
						)}

						{/* No questions in subsection */}
						{activeQuestions.length === 0 ? (
							<Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
								<QuizOutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
								<Typography>
									{selectedSubsection === 'all'
										? 'No questions in this quiz bank yet.'
										: selectedSubsection === 'incorrect'
											? 'No incorrect answers yet — keep practising!'
											: 'No correct answers yet — keep going!'}
								</Typography>
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
									<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
										<Pagination
											count={activeQuestions.length}
											page={currentPage + 1}
											onChange={handlePageChange}
											size='small'
											siblingCount={3}
											renderItem={(item) => {
												if (item.type !== 'page' || typeof item.page !== 'number')
													return <PaginationItem {...item} />;
												const qIndex = item.page - 1;
												const q = activeQuestions[qIndex];
												if (!q) return <PaginationItem {...item} />;
												const ans = courseAnswers.get(q._id);
												const isAnswered = ans && ans.selectedOptionIndices.length > 0;
												let finalSx: any = { fontWeight: 800, transition: 'all 0.2s ease' };
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
														},
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

				{/* ── Manage mode (admin/teacher) ─────────────────────────────── */}
				{managingBank && canPost && (
					<Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 740, mx: 'auto' }}>
						{/* Bank header */}
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								mb: 3,
								gap: 2,
							}}
						>
							{editingBankId === managingBank._id ? (
								<Box sx={{ flex: 1 }}>
									<TextField
										label='Title'
										value={editBankForm.title}
										onChange={(e) =>
											setEditBankForm((p) => ({ ...p, title: e.target.value }))
										}
										fullWidth
										size='small'
										sx={{ mb: 1 }}
									/>
									<TextField
										label='Description (optional)'
										value={editBankForm.description}
										onChange={(e) =>
											setEditBankForm((p) => ({
												...p,
												description: e.target.value,
											}))
										}
										fullWidth
										size='small'
										multiline
										minRows={2}
										sx={{ mb: 1 }}
									/>
									<Stack direction='row' spacing={1}>
										<Button size='small' onClick={() => setEditingBankId(null)}>
											Cancel
										</Button>
										<Button
											size='small'
											variant='contained'
											onClick={() => void handleUpdateBank()}
											disabled={editingBankLoading}
										>
											{editingBankLoading ? (
												<CircularProgress size={14} />
											) : (
												'Save'
											)}
										</Button>
									</Stack>
								</Box>
							) : (
								<Box>
									<Typography variant='h5' sx={{ fontWeight: 700 }}>
										{managingBank.title}
									</Typography>
									{managingBank.description && (
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{ mt: 0.5 }}
										>
											{managingBank.description}
										</Typography>
									)}
								</Box>
							)}

							{editingBankId !== managingBank._id && (
								<Stack direction='row' spacing={1} sx={{ flexShrink: 0 }}>
									<Button
										size='small'
										variant='outlined'
										startIcon={<EditOutlinedIcon />}
										onClick={() => {
											setEditingBankId(managingBank._id);
											setEditBankForm({
												title: managingBank.title,
												description: managingBank.description ?? '',
											});
										}}
									>
										Edit Bank
									</Button>
									<Button
										size='small'
										variant='contained'
										startIcon={<AddIcon />}
										onClick={() => setShowAddQuestion((p) => !p)}
									>
										Add Question
									</Button>
								</Stack>
							)}
						</Box>

						{/* Add question form */}
						<Collapse in={showAddQuestion}>
							<QuestionFormPanel
								form={qForm}
								onChange={setQForm}
								onSubmit={() => void handleAddQuestion()}
								onCancel={() => {
									setShowAddQuestion(false);
									setQForm(blankQForm());
								}}
								submitting={addingQ}
								submitLabel='Add Question'
							/>
						</Collapse>

						{/* Questions list */}
						<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5 }}>
							Questions ({managingBank.questions.length})
						</Typography>

						{managingBank.questions.length === 0 ? (
							<Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
								<Typography>
									No questions yet. Click Add Question to start.
								</Typography>
							</Box>
						) : (
							<Stack spacing={1.5}>
								{managingBank.questions.map((q, qi) => (
									<Paper
										key={q._id}
										variant='outlined'
										sx={{ p: 2, borderRadius: 0.5 }}
									>
										{editingQId === q._id ? (
											<QuestionFormPanel
												form={editQForm}
												onChange={setEditQForm}
												onSubmit={() => void handleUpdateQuestion()}
												onCancel={() => setEditingQId(null)}
												submitting={editingQLoading}
												submitLabel='Save'
											/>
										) : (
											<Box>
												<Box
													sx={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'flex-start',
														mb: 1.5,
													}}
												>
													<Box
														sx={{
															display: 'flex',
															gap: 1,
															alignItems: 'flex-start',
														}}
													>
														<Chip
															label={qi + 1}
															size='small'
															sx={{ fontWeight: 700, flexShrink: 0, mt: 0.1 }}
														/>
														<Typography
															variant='body2'
															sx={{ fontWeight: 600, lineHeight: 1.5 }}
														>
															{q.question}
														</Typography>
													</Box>
													<ItemActionMenu
														actions={[
															{
																label: 'Edit',
																icon: (
																	<EditOutlinedIcon
																		fontSize='small'
																		sx={{ mr: 1 }}
																	/>
																),
																onClick: () => {
																	setEditingQId(q._id);
																	setEditQForm({
																		question: q.question,
																		options: q.options.map((o) => ({
																			text: o.text,
																			explanation: o.explanation ?? '',
																		})),
																		correctOptionIndices:
																			q.correctOptionIndices,
																	});
																},
															},
															{
																label: 'Delete',
																color: 'error',
																icon: (
																	<DeleteOutlinedIcon
																		fontSize='small'
																		sx={{ mr: 1 }}
																	/>
																),
																onClick: () =>
																	void handleDeleteQuestion(
																		managingBank._id,
																		q._id,
																	),
															},
														]}
													/>
												</Box>

												<Stack spacing={0.5} sx={{ pl: 4.5 }}>
													{q.options.map((opt, oi) => {
														const isCorrect =
															q.correctOptionIndices.includes(oi);
														return (
															<Box
																key={oi}
																sx={{
																	display: 'flex',
																	gap: 1,
																	p: 0.75,
																	borderRadius: 0.5,
																	bgcolor: isCorrect
																		? 'rgba(34,197,94,0.1)'
																		: 'grey.50',
																	border: '1px solid',
																	borderColor: isCorrect
																		? '#22c55e'
																		: 'divider',
																}}
															>
																<Typography
																	variant='caption'
																	sx={{
																		fontWeight: 800,
																		color: isCorrect
																			? 'success.dark'
																			: 'text.secondary',
																		flexShrink: 0,
																		minWidth: 28,
																	}}
																>
																	{OPTION_LABELS[oi]}
																	{isCorrect ? ' ✓' : ''}
																</Typography>
																<Box>
																	<Typography
																		variant='caption'
																		sx={{ display: 'block', fontWeight: 500 }}
																	>
																		{opt.text}
																	</Typography>
																	{opt.explanation && (
																		<Typography
																			variant='caption'
																			sx={{
																				display: 'block',
																				color: 'text.secondary',
																				fontStyle: 'italic',
																			}}
																		>
																			{opt.explanation}
																		</Typography>
																	)}
																</Box>
															</Box>
														);
													})}
												</Stack>
											</Box>
										)}
									</Paper>
								))}
							</Stack>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
}

// ── Subsection progress button ─────────────────────────────────────────────

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
					<Typography variant='caption' sx={{ fontSize: '0.65rem', lineHeight: 1.2, color: 'text.secondary', whiteSpace: 'nowrap' }}>
						Wrong {incorrect} / Correct {correct}
					</Typography>
				</Box>
			</Box>
		</Button>
	);
}

// ── Question practice card ─────────────────────────────────────────────────

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
		isChecked &&
		arraysEqualSorted(selectedOptions, question.correctOptionIndices);
	const multipleCorrect = question.correctOptionIndices.length > 1;

	return (
		<Paper variant='outlined' sx={{ p: 3, borderRadius: 1 }}>
			{/* Question number */}
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

			{/* Question text */}
			<Typography
				variant='h6'
				sx={{ fontWeight: 600, mb: 3, lineHeight: 1.55, fontSize: '1.05rem' }}
			>
				{question.question}
			</Typography>

			{/* Options */}
			<Stack spacing={1.25}>
				{question.options.map((opt, idx) => {
					const isSelected = selectedOptions.includes(idx);
					const isCorrect = question.correctOptionIndices.includes(idx);

					let borderColor = 'divider';
					let bgColor = 'background.paper';

					if (isChecked) {
						if (isCorrect) {
							borderColor = '#22c55e';
							bgColor = 'rgba(34,197,94,0.1)';
						} else if (isSelected) {
							borderColor = '#ef4444';
							bgColor = 'rgba(239,68,68,0.1)';
						}
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
									'&:hover': {
										borderColor: 'primary.main',
										bgcolor: 'primary.50',
									},
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
									borderColor: isChecked
										? isCorrect
											? '#22c55e'
											: isSelected
												? '#ef4444'
												: 'divider'
										: isSelected
											? 'primary.main'
											: 'action.disabled',
									bgcolor: isChecked
										? isCorrect
											? '#22c55e'
											: isSelected
												? '#ef4444'
												: 'transparent'
										: isSelected
											? 'primary.main'
											: 'transparent',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
									mt: 0.15,
								}}
							>
								{(isSelected || (isChecked && isCorrect)) && (
									<Box
										component='span'
										sx={{
											color: 'white',
											fontSize: '0.65rem',
											fontWeight: 900,
											lineHeight: 1,
										}}
									>
										✓
									</Box>
								)}
							</Box>

							{/* Label */}
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									border: '1.5px solid',
									borderColor: isChecked
										? isCorrect
											? '#22c55e'
											: isSelected
												? '#ef4444'
												: 'divider'
										: isSelected
											? 'primary.main'
											: 'action.disabled',
									bgcolor: isChecked
										? isCorrect
											? '#22c55e'
											: isSelected
												? '#ef4444'
												: 'transparent'
										: isSelected
											? 'primary.main'
											: 'transparent',
									color:
										(isChecked && (isCorrect || isSelected)) ||
										(!isChecked && isSelected)
											? 'white'
											: 'text.secondary',
									fontWeight: 800,
									fontSize: '0.78rem',
									flexShrink: 0,
								}}
							>
								{OPTION_LABELS[idx]}
							</Box>

							{/* Option text + explanation */}
							<Box sx={{ flex: 1 }}>
								<Typography
									variant='body2'
									sx={{
										fontWeight: isSelected ? 600 : 400,
										lineHeight: 1.55,
										color: isChecked
											? isCorrect
												? 'success.dark'
												: isSelected
													? 'error.dark'
													: 'text.secondary'
											: isSelected
												? 'primary.main'
												: 'text.primary',
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

							{/* Result icon */}
							{isChecked && isCorrect && (
								<CheckCircleIcon
									sx={{ fontSize: 20, color: 'success.main', flexShrink: 0 }}
								/>
							)}
							{isChecked && isSelected && !isCorrect && (
								<CancelIcon
									sx={{ fontSize: 20, color: 'error.main', flexShrink: 0 }}
								/>
							)}
						</Box>
					);
				})}
			</Stack>

			{/* Result banner */}
			{isChecked && (
				<Box
					sx={{
						mt: 2,
						p: 1.5,
						borderRadius: 1,
						bgcolor: isCorrectAnswer
							? 'rgba(34,197,94,0.1)'
							: 'rgba(239,68,68,0.1)',
						border: '1px solid',
						borderColor: isCorrectAnswer ? '#22c55e' : '#ef4444',
					}}
				>
					<Typography
						variant='body2'
						sx={{
							fontWeight: 700,
							color: isCorrectAnswer ? 'success.dark' : 'error.dark',
						}}
					>
						{isCorrectAnswer
							? '✓ Correct!'
							: '✗ Incorrect — correct answer(s) are highlighted above.'}
					</Typography>
				</Box>
			)}

			{/* Action buttons */}
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
							submitting ? (
								<CircularProgress size={16} color='inherit' />
							) : undefined
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

// ── Question form panel ────────────────────────────────────────────────────

function QuestionFormPanel({
	form,
	onChange,
	onSubmit,
	onCancel,
	submitting,
	submitLabel,
}: {
	form: QFormState;
	onChange: React.Dispatch<React.SetStateAction<QFormState>>;
	onSubmit: () => void;
	onCancel: () => void;
	submitting: boolean;
	submitLabel: string;
}) {
	const toggleCorrect = (idx: number) => {
		onChange((p) => ({
			...p,
			correctOptionIndices: p.correctOptionIndices.includes(idx)
				? p.correctOptionIndices.filter((i) => i !== idx)
				: [...p.correctOptionIndices, idx],
		}));
	};

	return (
		<Paper variant='outlined' sx={{ p: 2.5, mb: 2.5, borderRadius: 0.5 }}>
			<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5 }}>
				Question
			</Typography>
			<TextField
				label='Question text'
				value={form.question}
				onChange={(e) => onChange((p) => ({ ...p, question: e.target.value }))}
				fullWidth
				size='small'
				multiline
				minRows={2}
				sx={{ mb: 2.5 }}
			/>

			<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
				Options{' '}
				<Typography
					component='span'
					variant='caption'
					color='text.secondary'
					sx={{ fontWeight: 400 }}
				>
					(check all correct answers)
				</Typography>
			</Typography>

			{form.options.map((opt, idx) => {
				const isCorrect = form.correctOptionIndices.includes(idx);
				return (
					<Box
						key={idx}
						sx={{
							mb: 2,
							p: 1.5,
							borderRadius: 1,
							border: '1px solid',
							borderColor: isCorrect ? '#22c55e' : 'divider',
							bgcolor: isCorrect ? 'rgba(34,197,94,0.05)' : 'transparent',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
							<Box
								sx={{
									width: 26,
									height: 26,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: isCorrect ? 'success.main' : 'grey.200',
									color: isCorrect ? 'white' : 'text.secondary',
									fontWeight: 800,
									fontSize: '0.75rem',
									flexShrink: 0,
								}}
							>
								{OPTION_LABELS[idx]}
							</Box>
							<FormControlLabel
								control={
									<Checkbox
										size='small'
										checked={isCorrect}
										onChange={() => toggleCorrect(idx)}
										color='success'
										sx={{ p: 0.5 }}
									/>
								}
								label={
									<Typography
										variant='caption'
										sx={{
											fontWeight: 600,
											color: isCorrect ? 'success.dark' : 'text.secondary',
										}}
									>
										Option {OPTION_LABELS[idx]}
										{isCorrect ? ' — correct' : ''}
									</Typography>
								}
								sx={{ m: 0 }}
							/>
						</Box>
						<TextField
							label={`Option ${OPTION_LABELS[idx]} text`}
							value={opt.text}
							onChange={(e) =>
								onChange((p) => ({
									...p,
									options: p.options.map((o, i) =>
										i === idx ? { ...o, text: e.target.value } : o,
									),
								}))
							}
							fullWidth
							size='small'
							sx={{ mb: 0.75 }}
						/>
						<TextField
							label={`Explanation for option ${OPTION_LABELS[idx]} (optional)`}
							value={opt.explanation}
							onChange={(e) =>
								onChange((p) => ({
									...p,
									options: p.options.map((o, i) =>
										i === idx ? { ...o, explanation: e.target.value } : o,
									),
								}))
							}
							fullWidth
							size='small'
						/>
					</Box>
				);
			})}

			<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
				<Button size='small' onClick={onCancel}>
					Cancel
				</Button>
				<Button
					size='small'
					variant='contained'
					onClick={onSubmit}
					disabled={submitting}
				>
					{submitting ? <CircularProgress size={14} /> : submitLabel}
				</Button>
			</Box>
		</Paper>
	);
}
