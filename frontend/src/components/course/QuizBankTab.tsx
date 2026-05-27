import { type FC, useState, useEffect, useRef } from 'react';
import {
	Box,
	CircularProgress,
	Collapse,
	Paper,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import toast from 'react-hot-toast';
import { quizBankService } from '../../services/quizBank.service';
import { quizSectionService } from '../../services/quizSection.service';
import type {
	IQuizSection,
	IQuizBank,
	IQuizAttempt,
} from '../../types/index';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import QuizBankSidebar, { type Subsection, type LocalAnswer } from './quizBank/QuizBankSidebar';
import QuizBankPracticePanel from './quizBank/QuizBankPracticePanel';
import QuizBankManagePanel from './quizBank/QuizBankManagePanel';
import { type QFormState, blankQForm } from './quizBank/QuestionFormPanel';

interface QuizBankTabProps {
	courseId: string;
	canPost: boolean;
	userId: string;
}

function getSubsectionQuestions(
	bank: IQuizBank,
	answers: Map<string, LocalAnswer>,
	sub: Subsection,
) {
	if (sub === 'all') return bank.questions;
	if (sub === 'incorrect')
		return bank.questions.filter((q) => {
			const a = answers.get(q._id);
			return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
		});
	return bank.questions.filter((q) => answers.get(q._id)?.isCorrect === true);
}

const QuizBankTab: FC<QuizBankTabProps> = ({
	courseId,
	canPost,
	userId: _userId,
}) => {
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
	const [courseStatsOpen, setCourseStatsOpen] = useState(true);
	const [bankStatsOpen, setBankStatsOpen] = useState(true);

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

	// Course-level stats (student view only) — only banks tied to a quiz section
	const sectionIds = new Set(quizSections.map((s) => s._id));
	const allCourseQuestions = quizBanks
		.filter((b) => b.quizSection && sectionIds.has(b.quizSection))
		.flatMap((b) => b.questions);
	const courseTotalQ = allCourseQuestions.length;
	const courseTotalCorrect = allCourseQuestions.filter(
		(q) => courseAnswers.get(q._id)?.isCorrect,
	).length;
	const courseTotalIncorrect = allCourseQuestions.filter((q) => {
		const a = courseAnswers.get(q._id);
		return a && a.selectedOptionIndices.length > 0 && !a.isCorrect;
	}).length;
	const courseTotalAnswered = courseTotalCorrect + courseTotalIncorrect;
	const courseTotalRemaining = courseTotalQ - courseTotalAnswered;
	const courseProgressPct =
		courseTotalQ > 0 ? Math.round((courseTotalCorrect / courseTotalQ) * 100) : 0;

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

	const handleToggleOption = (idx: number) => {
		if (isChecked) return;
		setSelectedOptions((prev) =>
			prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
		);
	};

	const handleResetAttempt = async (bankId?: string) => {
		const targetId = bankId ?? selectedBankId;
		if (!targetId) return;
		const targetBank = quizBanks.find((b) => b._id === targetId) ?? selectedBank;
		const ok = await confirm({
			title: 'Reset Practice',
			message: 'Clear all your answers for this quiz bank?',
			confirmText: 'Reset',
			cancelText: 'Cancel',
		});
		if (!ok) return;
		await quizBankService.resetAttempt(targetId);
		if (selectedBankId === targetId) setAttempt(null);
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
			<QuizBankSidebar
				canPost={canPost}
				quizSections={quizSections}
				quizBanks={quizBanks}
				selectedBankId={selectedBankId}
				selectedSubsection={selectedSubsection}
				managingBankId={managingBankId}
				expandedSections={expandedSections}
				expandedBanks={expandedBanks}
				courseAnswers={courseAnswers}
				showCreateSection={showCreateSection}
				createSecForm={createSecForm}
				creatingSec={creatingSec}
				editingSecId={editingSecId}
				editSecForm={editSecForm}
				editingSecLoading={editingSecLoading}
				createBankSectionId={createBankSectionId}
				createBankForm={createBankForm}
				creatingBank={creatingBank}
				editingBankId={editingBankId}
				editBankForm={editBankForm}
				editingBankLoading={editingBankLoading}
				onToggleSection={toggleSection}
				onToggleBank={toggleBank}
				onSelectBank={handleSelectBank}
				onManage={handleManage}
				onSetShowCreateSection={setShowCreateSection}
				onSetCreateSecForm={setCreateSecForm}
				onCreateSection={() => void handleCreateSection()}
				onSetEditingSecId={setEditingSecId}
				onSetEditSecForm={setEditSecForm}
				onUpdateSection={() => void handleUpdateSection()}
				onDeleteSection={(id) => void handleDeleteSection(id)}
				onToggleSectionPreview={(id, cur) => void handleToggleSectionPreview(id, cur)}
				onToggleBankPreview={(id, cur) => void handleToggleBankPreview(id, cur)}
				onSetCreateBankSectionId={setCreateBankSectionId}
				onSetCreateBankForm={setCreateBankForm}
				onCreateBank={(secId) => void handleCreateBank(secId)}
				onDeleteBank={(id) => void handleDeleteBank(id)}
				onSetEditingBankId={setEditingBankId}
				onSetEditBankForm={setEditBankForm}
				onUpdateBank={() => void handleUpdateBank()}
				onResetAttempt={(id) => void handleResetAttempt(id)}
			/>

			<Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
				{/* ── Course-level summary (student only) ─────────────────────── */}
				{!canPost && courseTotalQ > 0 && (
					<Paper
						variant='outlined'
						sx={{
							mx: { xs: 2, md: 3 },
							mt: { xs: 2, md: 3 },
							mb: 0,
							borderRadius: 0.5,
							bgcolor: 'background.paper',
							overflow: 'hidden',
						}}
					>
						{/* Header row — always visible */}
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

						{/* Collapsible progress bar */}
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

				{selectedBank && !managingBankId && (
					<QuizBankPracticePanel
						selectedBank={selectedBank}
						selectedSubsection={selectedSubsection}
						activeQuestions={activeQuestions}
						currentQuestion={currentQuestion}
						currentPage={currentPage}
						selectedOptions={selectedOptions}
						isChecked={isChecked}
						submitting={submitting}
						attemptLoading={attemptLoading}
						totalQ={totalQ}
						correctCount={correctCount}
						incorrectCount={incorrectCount}
						progressPct={progressPct}
						bankStatsOpen={bankStatsOpen}
						courseAnswers={courseAnswers}
						onSetBankStatsOpen={setBankStatsOpen}
						onSetCurrentPage={setCurrentPage}
						onSetSelectedOptions={setSelectedOptions}
						onSetIsChecked={setIsChecked}
						onToggleOption={handleToggleOption}
						onCheck={() => void handleCheck()}
						onNext={handleNext}
						onSkip={handleSkip}
						onResetAttempt={() => void handleResetAttempt()}
					/>
				)}

				{managingBank && canPost && (
					<QuizBankManagePanel
						managingBank={managingBank}
						editingBankId={editingBankId}
						editBankForm={editBankForm}
						editingBankLoading={editingBankLoading}
						showAddQuestion={showAddQuestion}
						qForm={qForm}
						addingQ={addingQ}
						editingQId={editingQId}
						editQForm={editQForm}
						editingQLoading={editingQLoading}
						onSetEditingBankId={setEditingBankId}
						onSetEditBankForm={setEditBankForm}
						onUpdateBank={() => void handleUpdateBank()}
						onSetShowAddQuestion={setShowAddQuestion}
						onSetQForm={setQForm}
						onAddQuestion={() => void handleAddQuestion()}
						onSetEditingQId={setEditingQId}
						onSetEditQForm={setEditQForm}
						onUpdateQuestion={() => void handleUpdateQuestion()}
						onDeleteQuestion={(bankId, qId) => void handleDeleteQuestion(bankId, qId)}
					/>
				)}
			</Box>
		</Box>
	);
};

export default QuizBankTab;
