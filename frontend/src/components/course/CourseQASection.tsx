import { type FC, useEffect, useMemo, useState } from 'react';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Paper,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import toast from 'react-hot-toast';
import { qaService } from '../../services/qa.service';
import type { IQuestion, IAnswer } from '../../types/index';
import RichTextEditor from './RichTextEditor';
import ItemActionMenu from '../common/ItemActionMenu';
import { formatDateTime } from '../../utils/dateTime';
import YouBadge from '../common/YouBadge';
import QAQuestionListView from './courseQA/QAQuestionListView';
import { useConfirmModal } from '../../context/ConfirmModalContext';

interface CourseQASectionProps {
	courseId: string;
	canPost: boolean;
	userId: string;
	userRole: string;
	initialQuestionId?: string | null;
}

type QuestionFilter = 'all' | 'needsStaffAnswer' | 'unresolved' | 'resolved';

const STAFF_ROLES = ['Admin', 'Super Admin', 'Moderator', 'Teacher'];

const CourseQASection: FC<CourseQASectionProps> = ({
	courseId,
	canPost,
	userId,
	userRole,
	initialQuestionId,
}) => {
	const { confirm } = useConfirmModal();
	const [questions, setQuestions] = useState<IQuestion[]>([]);
	const [qaLoading, setQaLoading] = useState(true);
	const [qaDetail, setQaDetail] = useState<{
		question: IQuestion;
		answers: IAnswer[];
	} | null>(null);
	const [qaDetailLoading, setQaDetailLoading] = useState(false);
	const [showAskForm, setShowAskForm] = useState(false);
	const [askForm, setAskForm] = useState({ title: '', description: '' });
	const [askPosting, setAskPosting] = useState(false);
	const [showAnswerForm, setShowAnswerForm] = useState(false);
	const [answerBody, setAnswerBody] = useState('');
	const [answerPosting, setAnswerPosting] = useState(false);
	// Incrementing this key forces the answer RichTextEditor to remount (clears Tiptap internal state)
	const [answerEditorKey, setAnswerEditorKey] = useState(0);
	// Same for the ask-question description editor
	const [askEditorKey, setAskEditorKey] = useState(0);
	const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
	const [editingQuestionForm, setEditingQuestionForm] = useState({
		title: '',
		description: '',
	});
	const [questionUpdating, setQuestionUpdating] = useState(false);
	const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
	const [editingAnswerBody, setEditingAnswerBody] = useState('');
	const [answerUpdating, setAnswerUpdating] = useState(false);
	const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('unresolved');
	const [resolvingQuestionId, setResolvingQuestionId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		setQaLoading(true);
		setQaDetail(null);
		qaService
			.getCourseQuestions(courseId)
			.then((r) => setQuestions(r.data ?? []))
			.catch(() => {})
			.finally(() => setQaLoading(false));
	}, [courseId]);

	useEffect(() => {
		if (!initialQuestionId) return;

		setQaDetailLoading(true);
		qaService
			.getQuestion(initialQuestionId)
			.then((res) => {
				if (res.data) setQaDetail(res.data);
			})
			.catch(() => {})
			.finally(() => setQaDetailLoading(false));
	}, [initialQuestionId]);

	useEffect(() => {
		setCurrentPage(1);
	}, [questionFilter, questions.length]);

	const isAdminOrMod = ['Admin', 'Super Admin', 'Moderator'].includes(userRole);
	const canDelete = (ownerId: string) => userId === ownerId || isAdminOrMod;
	const canEdit = canDelete;
	const canResolve = (question: IQuestion) =>
		isAdminOrMod || userRole === 'Teacher' || userId === question.postedBy._id;
	const isStaffAnswer = (answer: IAnswer) => STAFF_ROLES.includes(answer.postedBy.role);
	const questionHasNoStaffAnswer = (question: IQuestion) => !question.hasStaffAnswer;
	const questionNeedsStaffAnswer = (question: IQuestion) =>
		!question.isResolved && questionHasNoStaffAnswer(question);
	const filteredQuestions = useMemo(
		() =>
			questions.filter((question) => {
				if (questionFilter === 'resolved') return question.isResolved;
				if (questionFilter === 'unresolved') return !question.isResolved;
				if (questionFilter === 'needsStaffAnswer') {
					return questionHasNoStaffAnswer(question);
				}
				return true;
			}),
		[questionFilter, questions],
	);

	const questionFilterCounts = useMemo(
		() => ({
			all: questions.length,
			needsStaffAnswer: questions.filter(questionHasNoStaffAnswer).length,
			unresolved: questions.filter((question) => !question.isResolved).length,
			resolved: questions.filter((question) => question.isResolved).length,
		}),
		[questions],
	);

	const updateQuestionEverywhere = (updatedQuestion: IQuestion) => {
		setQuestions((p) =>
			p.map((question) =>
				question._id === updatedQuestion._id ? updatedQuestion : question,
			),
		);
		setQaDetail((p) =>
			p && p.question._id === updatedQuestion._id
				? { ...p, question: updatedQuestion }
				: p,
		);
	};

	// â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

	const handleViewQuestion = async (question: IQuestion) => {
		setQaDetailLoading(true);
		try {
			const res = await qaService.getQuestion(question._id);
			if (res.data) setQaDetail(res.data);
		} catch {
			//
		} finally {
			setQaDetailLoading(false);
		}
	};

	const handleAskQuestion = async () => {
		if (!askForm.title.trim() || !askForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setAskPosting(true);
		try {
			const res = await qaService.createQuestion(courseId, askForm);
			if (res.data) setQuestions((p) => [res.data!, ...p]);
			setAskForm({ title: '', description: '' });
			setAskEditorKey((k) => k + 1);
			setShowAskForm(false);
			toast.success('Question posted');
		} catch {
			//
		} finally {
			setAskPosting(false);
		}
	};

	const handleDeleteQuestion = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Question',
			message: 'Delete this question and all its answers?',
			confirmText: 'Delete Question',
			cancelText: 'Keep Question',
		});
		if (!confirmed) return;
		try {
			await qaService.deleteQuestion(id);
			setQuestions((p) => p.filter((q) => q._id !== id));
			if (qaDetail?.question._id === id) setQaDetail(null);
			toast.success('Question deleted');
		} catch {
			//
		}
	};

	const startEditQuestion = (question: IQuestion) => {
		setEditingAnswerId(null);
		setEditingQuestionId(question._id);
		setEditingQuestionForm({
			title: question.title,
			description: question.description,
		});
	};

	const handleUpdateQuestion = async () => {
		if (!editingQuestionId) return;
		if (!editingQuestionForm.title.trim() || !editingQuestionForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}

		setQuestionUpdating(true);
		try {
			const res = await qaService.updateQuestion(editingQuestionId, editingQuestionForm);
			if (res.data) {
				setQuestions((p) =>
					p.map((q) => (q._id === editingQuestionId ? res.data! : q)),
				);
				setQaDetail((p) =>
					p && p.question._id === editingQuestionId
						? { ...p, question: res.data! }
						: p,
				);
			}
			setEditingQuestionId(null);
			toast.success('Question updated');
		} catch {
			//
		} finally {
			setQuestionUpdating(false);
		}
	};

	const handleResolveQuestion = async (question: IQuestion, isResolved: boolean) => {
		setResolvingQuestionId(question._id);
		try {
			const res = await qaService.resolveQuestion(question._id, isResolved);
			if (res.data) updateQuestionEverywhere(res.data);
			toast.success(isResolved ? 'Question marked as solved' : 'Question reopened');
		} catch {
			//
		} finally {
			setResolvingQuestionId(null);
		}
	};

	const handleUpvoteQuestion = async (id: string) => {
		const toggle = (ids: string[]) =>
			ids.includes(userId)
				? ids.filter((u) => u !== userId)
				: [...ids, userId];

		setQuestions((p) =>
			p.map((q) => (q._id === id ? { ...q, upvotes: toggle(q.upvotes) } : q)),
		);
		setQaDetail((p) =>
			p && p.question._id === id
				? { ...p, question: { ...p.question, upvotes: toggle(p.question.upvotes) } }
				: p,
		);

		try {
			const res = await qaService.upvoteQuestion(id);
			if (res.data) {
				setQuestions((p) =>
					p.map((q) => (q._id === id ? { ...q, upvotes: res.data!.upvotes } : q)),
				);
				setQaDetail((p) =>
					p && p.question._id === id
						? { ...p, question: { ...p.question, upvotes: res.data!.upvotes } }
						: p,
				);
			}
		} catch {
			//
		}
	};

	const handlePostAnswer = async () => {
		if (!answerBody.trim() || !qaDetail) return;
		setAnswerPosting(true);
		try {
			const res = await qaService.createAnswer(qaDetail.question._id, {
				body: answerBody,
			});
			if (res.data) {
				const answerIsFromStaff = isStaffAnswer(res.data);
				setQaDetail((p) =>
					p
						? {
								...p,
								question: {
									...p.question,
									answerCount: p.question.answerCount + 1,
									staffAnswerCount:
										p.question.staffAnswerCount + (answerIsFromStaff ? 1 : 0),
									hasStaffAnswer:
										p.question.hasStaffAnswer || answerIsFromStaff,
								},
								answers: [...p.answers, res.data!],
							}
						: p,
				);
				setQuestions((p) =>
					p.map((q) =>
						q._id === qaDetail.question._id
							? {
									...q,
									answerCount: q.answerCount + 1,
									staffAnswerCount:
										q.staffAnswerCount + (answerIsFromStaff ? 1 : 0),
									hasStaffAnswer: q.hasStaffAnswer || answerIsFromStaff,
								}
							: q,
					),
				);
			}
			setAnswerBody('');
			setAnswerEditorKey((k) => k + 1);
			setShowAnswerForm(false);
			toast.success('Answer posted');
		} catch {
			//
		} finally {
			setAnswerPosting(false);
		}
	};

	const handleDeleteAnswer = async (answerId: string) => {
		const confirmed = await confirm({
			title: 'Delete Answer',
			message: 'Delete this answer?',
			confirmText: 'Delete Answer',
			cancelText: 'Keep Answer',
		});
		if (!confirmed) return;
		const answer = qaDetail?.answers.find((a) => a._id === answerId);
		const answerIsFromStaff = answer ? isStaffAnswer(answer) : false;
		try {
			await qaService.deleteAnswer(answerId);
			setQaDetail((p) => {
				if (!p) return p;
				const staffAnswerCount = Math.max(
					0,
					p.question.staffAnswerCount - (answerIsFromStaff ? 1 : 0),
				);

				return {
					...p,
					question: {
						...p.question,
						answerCount: Math.max(0, p.question.answerCount - 1),
						staffAnswerCount,
						hasStaffAnswer: staffAnswerCount > 0,
					},
					answers: p.answers.filter((a) => a._id !== answerId),
				};
			});
			if (qaDetail) {
				setQuestions((p) =>
					p.map((q) =>
						q._id === qaDetail.question._id
							? (() => {
									const staffAnswerCount = Math.max(
										0,
										q.staffAnswerCount - (answerIsFromStaff ? 1 : 0),
									);
									return {
										...q,
										answerCount: Math.max(0, q.answerCount - 1),
										staffAnswerCount,
										hasStaffAnswer: staffAnswerCount > 0,
									};
								})()
							: q,
					),
				);
			}
			toast.success('Answer deleted');
		} catch {
			//
		}
	};

	const startEditAnswer = (answer: IAnswer) => {
		setEditingQuestionId(null);
		setEditingAnswerId(answer._id);
		setEditingAnswerBody(answer.body);
	};

	const handleUpdateAnswer = async () => {
		if (!editingAnswerId || !editingAnswerBody.trim()) return;

		setAnswerUpdating(true);
		try {
			const res = await qaService.updateAnswer(editingAnswerId, {
				body: editingAnswerBody,
			});
			if (res.data) {
				setQaDetail((p) =>
					p
						? {
								...p,
								answers: p.answers.map((a) =>
									a._id === editingAnswerId ? res.data! : a,
								),
							}
						: p,
				);
			}
			setEditingAnswerId(null);
			toast.success('Answer updated');
		} catch {
			//
		} finally {
			setAnswerUpdating(false);
		}
	};

	const handleUpvoteAnswer = async (answerId: string) => {
		const toggle = (ids: string[]) =>
			ids.includes(userId)
				? ids.filter((u) => u !== userId)
				: [...ids, userId];

		setQaDetail((p) =>
			p
				? {
						...p,
						answers: p.answers.map((a) =>
							a._id === answerId ? { ...a, upvotes: toggle(a.upvotes) } : a,
						),
					}
				: p,
		);

		try {
			const res = await qaService.upvoteAnswer(answerId);
			if (res.data) {
				setQaDetail((p) =>
					p
						? {
								...p,
								answers: p.answers.map((a) =>
									a._id === answerId
										? { ...a, upvotes: res.data!.upvotes }
										: a,
								),
							}
						: p,
				);
			}
		} catch {
			//
		}
	};

	// â”€â”€ UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

	if (qaDetailLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (qaDetail) {
		return (
			<Box>
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => { setQaDetail(null); setShowAnswerForm(false); }}
					sx={{ mb: 3, fontWeight: 600 }}
				>
					Back to Questions
				</Button>

				{/* Question card */}
				<Paper
					variant='outlined'
					sx={{
						p: 3,
						borderRadius: 0.5,
						boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
						mb: 3,
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
						<Avatar
							src={qaDetail.question.postedBy.avatar}
							sx={{ width: 26, height: 26, fontSize: 12, bgcolor: 'primary.main' }}
						>
							{qaDetail.question.postedBy.name[0]}
						</Avatar>
						<Typography variant='caption' color='text.secondary'>
							{qaDetail.question.postedBy.name}{' '}
							{userId === qaDetail.question.postedBy._id && <YouBadge />}
							{' Â· '}
							<Chip
								label={qaDetail.question.postedBy.role}
								size='small'
								sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, px: 0.5 }}
							/>
							{' Â· '}
							{formatDateTime(qaDetail.question.createdAt)}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
						<Chip
							icon={
								qaDetail.question.isResolved ? (
									<CheckCircleOutlinedIcon />
								) : (
									<HelpOutlinedIcon />
								)
							}
							label={qaDetail.question.isResolved ? 'Solved' : 'Open'}
							size='small'
							color={qaDetail.question.isResolved ? 'success' : 'default'}
							variant={qaDetail.question.isResolved ? 'filled' : 'outlined'}
							sx={{ fontWeight: 700 }}
						/>
						{questionNeedsStaffAnswer(qaDetail.question) && (
							<Chip
								icon={<ErrorOutlinedIcon />}
								label='Needs staff answer'
								size='small'
								color='warning'
								variant='filled'
								sx={{ fontWeight: 700 }}
							/>
						)}
					</Box>
					{editingQuestionId === qaDetail.question._id ? (
						<Box sx={{ mb: 2 }}>
							<TextField
								label='Title'
								value={editingQuestionForm.title}
								onChange={(e) =>
									setEditingQuestionForm((p) => ({
										...p,
										title: e.target.value,
									}))
								}
								fullWidth
								size='small'
								sx={{ mb: 1.5 }}
							/>
							<RichTextEditor
								value={editingQuestionForm.description}
								onChange={(html) =>
									setEditingQuestionForm((p) => ({
										...p,
										description: html,
									}))
								}
								placeholder='Update your question...'
								minHeight={130}
							/>
						</Box>
					) : (
						<Typography variant='h5' sx={{ fontWeight: 700, mb: 1.5 }}>
							{qaDetail.question.title}
						</Typography>
					)}
					{editingQuestionId !== qaDetail.question._id && (
						<Box
							sx={{
								fontSize: '0.9rem',
								lineHeight: 1.7,
								'& p': { m: 0, mb: 0.5 },
								'& ul, & ol': { pl: 2.5, my: 0.5 },
							}}
							dangerouslySetInnerHTML={{ __html: qaDetail.question.description }}
						/>
					)}
					<Divider sx={{ my: 2 }} />
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{editingQuestionId === qaDetail.question._id ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'flex-end',
									gap: 1,
									width: '100%',
								}}
							>
								<Button
									size='small'
									onClick={() => setEditingQuestionId(null)}
								>
									Cancel
								</Button>
								<Button
									size='small'
									variant='contained'
									onClick={() => void handleUpdateQuestion()}
									disabled={
										questionUpdating ||
										!editingQuestionForm.title.trim() ||
										!editingQuestionForm.description.trim()
									}
								>
									{questionUpdating ? (
										<CircularProgress size={16} color='inherit' />
									) : (
										'Update'
									)}
								</Button>
							</Box>
						) : (
							<>
								<Tooltip
									title={
										qaDetail.question.upvotes.includes(userId)
											? 'Remove upvote'
											: 'Upvote'
									}
								>
									<Button
										size='small'
										startIcon={
											qaDetail.question.upvotes.includes(userId) ? (
												<ThumbUpIcon fontSize='small' />
											) : (
												<ThumbUpOutlinedIcon fontSize='small' />
											)
										}
										onClick={() => void handleUpvoteQuestion(qaDetail.question._id)}
										color={
											qaDetail.question.upvotes.includes(userId)
												? 'primary'
												: 'inherit'
										}
										sx={{ fontWeight: 600 }}
									>
										{qaDetail.question.upvotes.length}
									</Button>
								</Tooltip>
								{canResolve(qaDetail.question) && (
									<Button
										size='small'
										variant={qaDetail.question.isResolved ? 'outlined' : 'contained'}
										color={qaDetail.question.isResolved ? 'inherit' : 'success'}
										startIcon={
											qaDetail.question.isResolved ? (
												<HelpOutlinedIcon fontSize='small' />
											) : (
												<CheckCircleOutlinedIcon fontSize='small' />
											)
										}
										onClick={() =>
											void handleResolveQuestion(
												qaDetail.question,
												!qaDetail.question.isResolved,
											)
										}
										disabled={resolvingQuestionId === qaDetail.question._id}
										sx={{ fontWeight: 700 }}
									>
										{resolvingQuestionId === qaDetail.question._id ? (
											<CircularProgress size={16} color='inherit' />
										) : qaDetail.question.isResolved ? (
											'Mark not solved'
										) : (
											'Mark solved'
										)}
									</Button>
								)}
							</>
						)}
						{canEdit(qaDetail.question.postedBy._id) &&
							editingQuestionId !== qaDetail.question._id && (
							<ItemActionMenu
								actions={[
									{
										label: 'Edit',
										icon: (
											<EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />
										),
										onClick: () => startEditQuestion(qaDetail.question),
									},
									{
										label: 'Delete',
										color: 'error',
										icon: (
											<DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />
										),
										onClick: () =>
											void handleDeleteQuestion(qaDetail.question._id),
									},
								]}
							/>
						)}
					</Box>
				</Paper>

				{/* Add Answer â€” button + inline form, appears right below the question */}
				{canPost && (
					<Box sx={{ mb: 3 }}>
						{!showAnswerForm ? (
							<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
								<Button
									variant='outlined'
									startIcon={<AddIcon />}
									onClick={() => setShowAnswerForm(true)}
									sx={{ fontWeight: 600 }}
								>
									Add Answer
								</Button>
							</Box>
						) : (
							<Paper
								variant='outlined'
								sx={{ p: 2.5, borderRadius: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
							>
								<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5 }}>
									Your Answer
								</Typography>
								<RichTextEditor
									key={answerEditorKey}
									value={answerBody}
									onChange={setAnswerBody}
									placeholder='Write your answer...'
									minHeight={120}
								/>
								<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
									<Button
										size='small'
										onClick={() => {
											setShowAnswerForm(false);
											setAnswerBody('');
											setAnswerEditorKey((k) => k + 1);
										}}
									>
										Cancel
									</Button>
									<Button
										size='small'
										variant='contained'
										onClick={() => void handlePostAnswer()}
										disabled={answerPosting || !answerBody.trim()}
									>
										{answerPosting ? (
											<CircularProgress size={16} color='inherit' />
										) : (
											'Post Answer'
										)}
									</Button>
								</Box>
							</Paper>
						)}
					</Box>
				)}

				{/* Answers list */}
				<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
					{qaDetail.answers.length} Answer
					{qaDetail.answers.length !== 1 ? 's' : ''}
				</Typography>

				{qaDetail.answers.length > 0 && (
					<Paper
						variant='outlined'
						sx={{
							mb: 3,
							borderRadius: 0.5,
							boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
							overflow: 'hidden',
						}}
					>
						{qaDetail.answers.map((answer, index) => (
							<Box key={answer._id}>
								{index > 0 && <Divider />}
								<Box sx={{ p: 2.5 }}>
									<Box
										sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
									>
										<Avatar
											src={answer.postedBy.avatar}
											sx={{
												width: 26,
												height: 26,
												fontSize: 12,
												bgcolor: 'secondary.main',
											}}
										>
											{answer.postedBy.name[0]}
										</Avatar>
										<Box sx={{ flex: 1 }}>
											<Typography variant='caption' sx={{ fontWeight: 600 }}>
												{answer.postedBy.name}{' '}
												{userId === answer.postedBy._id && <YouBadge />}
											</Typography>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ ml: 0.75 }}
											>
												Â·{' '}
												<Chip
													label={answer.postedBy.role}
													size='small'
													sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, px: 0.5 }}
												/>
												{' Â· '}
												{formatDateTime(answer.createdAt)}
											</Typography>
										</Box>
										{canEdit(answer.postedBy._id) &&
											editingAnswerId !== answer._id && (
											<ItemActionMenu
												actions={[
													{
														label: 'Edit',
														icon: (
															<EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />
														),
														onClick: () => startEditAnswer(answer),
													},
													{
														label: 'Delete',
														color: 'error',
														icon: (
															<DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />
														),
														onClick: () => void handleDeleteAnswer(answer._id),
													},
												]}
											/>
										)}
									</Box>
									{editingAnswerId === answer._id ? (
										<Box>
											<RichTextEditor
												value={editingAnswerBody}
												onChange={setEditingAnswerBody}
												placeholder='Update your answer...'
												minHeight={110}
											/>
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'flex-end',
													gap: 1,
													mt: 1.5,
												}}
											>
												<Button
													size='small'
													onClick={() => setEditingAnswerId(null)}
												>
													Cancel
												</Button>
												<Button
													size='small'
													variant='contained'
													onClick={() => void handleUpdateAnswer()}
													disabled={answerUpdating || !editingAnswerBody.trim()}
												>
													{answerUpdating ? (
														<CircularProgress size={16} color='inherit' />
													) : (
														'Update'
													)}
												</Button>
											</Box>
										</Box>
									) : (
										<>
											<Box
												sx={{
													fontSize: '0.875rem',
													lineHeight: 1.7,
													mb: 1.5,
													'& p': { m: 0, mb: 0.5 },
													'& ul, & ol': { pl: 2.5, my: 0.5 },
												}}
												dangerouslySetInnerHTML={{ __html: answer.body }}
											/>
											<Tooltip
												title={
													answer.upvotes.includes(userId)
														? 'Remove upvote'
														: 'Upvote this answer'
												}
											>
												<Button
													size='small'
													startIcon={
														answer.upvotes.includes(userId) ? (
															<ThumbUpIcon fontSize='small' />
														) : (
															<ThumbUpOutlinedIcon fontSize='small' />
														)
													}
													onClick={() => void handleUpvoteAnswer(answer._id)}
													color={
														answer.upvotes.includes(userId) ? 'primary' : 'inherit'
													}
													sx={{ fontWeight: 600 }}
												>
													{answer.upvotes.length}
												</Button>
											</Tooltip>
										</>
									)}
								</Box>
							</Box>
						))}
					</Paper>
				)}

		</Box>
		);
	}


	return (
		<QAQuestionListView
			questions={questions}
			qaLoading={qaLoading}
			canPost={canPost}
			userId={userId}
			showAskForm={showAskForm}
			setShowAskForm={setShowAskForm}
			askForm={askForm}
			setAskForm={setAskForm}
			askPosting={askPosting}
			askEditorKey={askEditorKey}
			setAskEditorKey={setAskEditorKey}
			questionFilter={questionFilter}
			setQuestionFilter={setQuestionFilter}
			filteredQuestions={filteredQuestions}
			questionFilterCounts={questionFilterCounts}
			currentPage={currentPage}
			setCurrentPage={setCurrentPage}
			editingQuestionId={editingQuestionId}
			setEditingQuestionId={setEditingQuestionId}
			editingQuestionForm={editingQuestionForm}
			setEditingQuestionForm={setEditingQuestionForm}
			questionUpdating={questionUpdating}
			resolvingQuestionId={resolvingQuestionId}
			canEdit={canEdit}
			canResolve={canResolve}
			questionNeedsStaffAnswer={questionNeedsStaffAnswer}
			onAskQuestion={handleAskQuestion}
			onViewQuestion={handleViewQuestion}
			onUpvoteQuestion={handleUpvoteQuestion}
			onResolveQuestion={handleResolveQuestion}
			onDeleteQuestion={handleDeleteQuestion}
			onUpdateQuestion={handleUpdateQuestion}
			onStartEditQuestion={startEditQuestion}
		/>
	);
};

export default CourseQASection;
