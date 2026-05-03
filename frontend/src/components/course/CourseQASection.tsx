import { useEffect, useState } from 'react';
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
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import toast from 'react-hot-toast';
import { qaService } from '../../services/qa.service';
import type { IQuestion, IAnswer } from '../../types/index';
import RichTextEditor from './RichTextEditor';
import ItemActionMenu from '../common/ItemActionMenu';
import { formatDateTime } from '../../utils/dateTime';

interface CourseQASectionProps {
	courseId: string;
	canPost: boolean;
	userId: string;
	userRole: string;
}

export default function CourseQASection({
	courseId,
	canPost,
	userId,
	userRole,
}: CourseQASectionProps) {
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

	useEffect(() => {
		setQaLoading(true);
		setQaDetail(null);
		qaService
			.getCourseQuestions(courseId)
			.then((r) => setQuestions(r.data ?? []))
			.catch(() => {})
			.finally(() => setQaLoading(false));
	}, [courseId]);

	const isAdminOrMod = ['Admin', 'Super Admin', 'Moderator'].includes(userRole);
	const canDelete = (ownerId: string) => userId === ownerId || isAdminOrMod;
	const canEdit = canDelete;

	// ── Handlers ──────────────────────────────────────────────

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
		if (!confirm('Delete this question and all its answers?')) return;
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
				setQaDetail((p) => (p ? { ...p, answers: [...p.answers, res.data!] } : p));
				setQuestions((p) =>
					p.map((q) =>
						q._id === qaDetail.question._id
							? { ...q, answerCount: q.answerCount + 1 }
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
		if (!confirm('Delete this answer?')) return;
		try {
			await qaService.deleteAnswer(answerId);
			setQaDetail((p) =>
				p ? { ...p, answers: p.answers.filter((a) => a._id !== answerId) } : p,
			);
			if (qaDetail) {
				setQuestions((p) =>
					p.map((q) =>
						q._id === qaDetail.question._id
							? { ...q, answerCount: Math.max(0, q.answerCount - 1) }
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

	// ── UI ────────────────────────────────────────────────────

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
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
						<Avatar
							src={qaDetail.question.postedBy.avatar}
							sx={{ width: 26, height: 26, fontSize: 12, bgcolor: 'primary.main' }}
						>
							{qaDetail.question.postedBy.name[0]}
						</Avatar>
						<Typography variant='caption' color='text.secondary'>
							{qaDetail.question.postedBy.name}
							{' · '}
							<Chip
								label={qaDetail.question.postedBy.role}
								size='small'
								sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, px: 0.5 }}
							/>
							{' · '}
							{formatDateTime(qaDetail.question.createdAt)}
						</Typography>
					</Box>
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

				{/* Add Answer — button + inline form, appears right below the question */}
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

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
					{qaDetail.answers.map((answer) => (
						<Paper
							key={answer._id}
							variant='outlined'
							sx={{
								p: 2.5,
								borderRadius: 0.5,
								boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
							}}
						>
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
										{answer.postedBy.name}
									</Typography>
									<Typography
										variant='caption'
										color='text.secondary'
										sx={{ ml: 0.75 }}
									>
										·{' '}
										<Chip
											label={answer.postedBy.role}
											size='small'
											sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, px: 0.5 }}
										/>
										{' · '}
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
						</Paper>
					))}
				</Box>

		</Box>
		);
	}

	// ── Question list view ────────────────────────────────────
	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Typography variant='h5' sx={{ fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
					Q &amp; A
					{!qaLoading && (
						<Typography component='span' variant='body2' color='text.secondary' sx={{ fontWeight: 400 }}>
							{questions.length} question{questions.length !== 1 ? 's' : ''}
						</Typography>
					)}
				</Typography>
				{canPost && (
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={() => setShowAskForm((p) => !p)}
					>
						Ask a Question
					</Button>
				)}
			</Box>

			{/* Ask question form */}
			{canPost && showAskForm && (
				<Paper
					variant='outlined'
					sx={{
						p: 2.5,
						mb: 3,
						borderRadius: 0.5,
						boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
					}}
				>
					<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5 }}>
						New Question
					</Typography>
					<TextField
						label='Title'
						value={askForm.title}
						onChange={(e) => setAskForm((p) => ({ ...p, title: e.target.value }))}
						fullWidth
						size='small'
						sx={{ mb: 1.5 }}
					/>
					<RichTextEditor
						key={askEditorKey}
						value={askForm.description}
						onChange={(html) => setAskForm((p) => ({ ...p, description: html }))}
						placeholder='Describe your question in detail...'
						minHeight={120}
					/>
					<Box
						sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}
					>
						<Button
							size='small'
							onClick={() => {
								setShowAskForm(false);
								setAskForm({ title: '', description: '' });
								setAskEditorKey((k) => k + 1);
							}}
						>
							Cancel
						</Button>
						<Button
							size='small'
							variant='contained'
							onClick={() => void handleAskQuestion()}
							disabled={askPosting}
						>
							{askPosting ? (
								<CircularProgress size={16} color='inherit' />
							) : (
								'Post Question'
							)}
						</Button>
					</Box>
				</Paper>
			)}

			{/* Questions list */}
			{qaLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress />
				</Box>
			) : questions.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 8 }}>
					<ForumOutlinedIcon
						sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }}
					/>
					<Typography
						variant='h6'
						color='text.secondary'
						sx={{ fontWeight: 600 }}
					>
						No questions yet
					</Typography>
					{canPost && (
						<Typography
							variant='body2'
							color='text.secondary'
							sx={{ mt: 0.5 }}
						>
							Be the first to ask a question!
						</Typography>
					)}
				</Box>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{questions.map((q) => {
						const hasUpvoted = q.upvotes.includes(userId);
						return (
							<Paper
								key={q._id}
								variant='outlined'
								onClick={
									editingQuestionId === q._id
										? undefined
										: () => void handleViewQuestion(q)
								}
								sx={{
									p: 2.5,
									borderRadius: 0.5,
									boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
									cursor: editingQuestionId === q._id ? 'default' : 'pointer',
									transition: 'box-shadow 0.2s, border-color 0.2s',
									...(editingQuestionId === q._id
										? {}
										: {
												'&:hover': {
													boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
													borderColor: 'primary.main',
												},
											}),
								}}
							>
								<Box
									sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
								>
									{/* Upvote column */}
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 0.5,
											minWidth: 44,
											flexShrink: 0,
										}}
										onClick={(e) => {
											e.stopPropagation();
											void handleUpvoteQuestion(q._id);
										}}
									>
										{hasUpvoted ? (
											<ThumbUpIcon
												sx={{ fontSize: 20, color: 'primary.main' }}
											/>
										) : (
											<ThumbUpOutlinedIcon
												sx={{ fontSize: 20, color: 'text.secondary' }}
											/>
										)}
										<Typography
											variant='caption'
											sx={{
												fontWeight: 700,
												color: hasUpvoted ? 'primary.main' : 'text.secondary',
											}}
										>
											{q.upvotes.length}
										</Typography>
									</Box>

									{/* Content */}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										{editingQuestionId === q._id ? (
											<Box
												onClick={(e) => e.stopPropagation()}
												sx={{ mb: 1.5 }}
											>
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
													minHeight={120}
												/>
											</Box>
										) : (
											<>
												<Typography
													variant='subtitle1'
													sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}
												>
													{q.title}
												</Typography>
												<Typography
													variant='body2'
													color='text.secondary'
													sx={{
														mb: 1.5,
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical',
														overflow: 'hidden',
													}}
													dangerouslySetInnerHTML={{
														__html: q.description.replace(/<[^>]*>/g, ' ').trim(),
													}}
												/>
											</>
										)}
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1.5,
												flexWrap: 'wrap',
											}}
										>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 0.75,
													flex: 1,
													minWidth: 0,
												}}
											>
												<Avatar
													src={q.postedBy.avatar}
													sx={{
														width: 20,
														height: 20,
														fontSize: 10,
														bgcolor: 'primary.main',
													}}
												>
													{q.postedBy.name[0]}
												</Avatar>
												<Typography variant='caption' color='text.secondary' noWrap>
													{q.postedBy.name}
												</Typography>
												<Chip
													label={q.postedBy.role}
													size='small'
													sx={{
														height: 16,
														fontSize: '0.6rem',
														fontWeight: 700,
														px: 0.25,
														flexShrink: 0,
													}}
												/>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ flexShrink: 0 }}
												>
													·{' '}
													{formatDateTime(q.createdAt)}
												</Typography>
											</Box>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 0.75,
													flexShrink: 0,
												}}
											>
												<ForumOutlinedIcon
													sx={{ fontSize: 15, color: 'text.secondary' }}
												/>
												<Typography
													variant='caption'
													sx={{ fontWeight: 600, color: 'text.secondary' }}
												>
													{q.answerCount} answer
													{q.answerCount !== 1 ? 's' : ''}
												</Typography>
												{editingQuestionId === q._id ? (
													<Box
														onClick={(e) => e.stopPropagation()}
														sx={{ display: 'flex', gap: 1 }}
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
													canEdit(q.postedBy._id) && (
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
																onClick: () => startEditQuestion(q),
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
																	void handleDeleteQuestion(q._id),
															},
														]}
													/>
												))}
											</Box>
										</Box>
									</Box>
								</Box>
							</Paper>
						);
					})}
				</Box>
			)}
		</Box>
	);
}
