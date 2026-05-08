import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Paper,
	Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import { qaService } from '../../services/qa.service';
import type { ICourseQuestionGroup, IQuestion } from '../../types/index';
import { formatDateTime } from '../../utils/dateTime';

type QuestionFilter = 'unresolved' | 'all' | 'needsStaffAnswer' | 'resolved';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const questionHasNoStaffAnswer = (question: IQuestion) => !question.hasStaffAnswer;
const questionNeedsStaffAnswer = (question: IQuestion) =>
	!question.isResolved && questionHasNoStaffAnswer(question);

export default function AdminCourseQAPage() {
	const [groups, setGroups] = useState<ICourseQuestionGroup[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		qaService
			.getAllCourseQuestions()
			.then((res) =>
				setGroups(
					(res.data ?? []).filter((group) =>
						group.questions.some((question) => !question.isResolved),
					),
				),
			)
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const totalQuestions = groups.reduce(
		(total, group) => total + group.questions.length,
		0,
	);

	return (
		<Box sx={{ maxWidth: 1180 }}>
			<Box sx={{ mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 800, mb: 0.5 }}>
					All Course Q &amp; A
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Review questions across every course and jump directly into the course
					Q&amp;A thread to answer or resolve it.
				</Typography>
			</Box>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
					<CircularProgress />
				</Box>
			) : groups.length === 0 ? (
				<Paper
					variant='outlined'
					sx={{ p: 5, textAlign: 'center', borderRadius: 1 }}
				>
					<QuestionAnswerOutlinedIcon
						sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }}
					/>
					<Typography variant='h6' sx={{ fontWeight: 700 }}>
						No course questions yet
					</Typography>
				</Paper>
			) : (
				<>
					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
						<Chip label={`${groups.length} courses`} sx={{ fontWeight: 700 }} />
						<Chip label={`${totalQuestions} questions`} sx={{ fontWeight: 700 }} />
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
						{groups.map((group) => (
							<CourseQuestionCard key={group.course._id} group={group} />
						))}
					</Box>
				</>
			)}
		</Box>
	);
}

function CourseQuestionCard({ group }: { group: ICourseQuestionGroup }) {
	const navigate = useNavigate();
	const [filter, setFilter] = useState<QuestionFilter>('unresolved');

	const filteredQuestions = useMemo(
		() =>
			group.questions.filter((question) => {
				if (filter === 'resolved') return question.isResolved;
				if (filter === 'unresolved') return !question.isResolved;
				if (filter === 'needsStaffAnswer') return questionHasNoStaffAnswer(question);
				return true;
			}),
		[filter, group.questions],
	);

	const counts = useMemo(
		() => ({
			all: group.questions.length,
			needsStaffAnswer: group.questions.filter(questionHasNoStaffAnswer).length,
			unresolved: group.questions.filter((question) => !question.isResolved).length,
			resolved: group.questions.filter((question) => question.isResolved).length,
		}),
		[group.questions],
	);

	const openQuestion = (question: IQuestion) => {
		navigate(
			`/admin/courses/${group.course._id}/learn?questionId=${question._id}`,
		);
	};

	return (
		<Paper variant='outlined' sx={{ borderRadius: 1, overflow: 'hidden' }}>
			<Box
				sx={{
					px: 2.5,
					py: 2,
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					gap: 2,
					bgcolor: 'background.paper',
				}}
			>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant='h6' sx={{ fontWeight: 800, lineHeight: 1.25 }}>
						{group.course.title}
					</Typography>
					{group.course.subtitle && (
						<Typography variant='body2' color='text.secondary' noWrap>
							{group.course.subtitle}
						</Typography>
					)}
				</Box>
				<Chip
					label={`${group.questions.length} question${group.questions.length !== 1 ? 's' : ''}`}
					size='small'
					sx={{ fontWeight: 700, flexShrink: 0 }}
				/>
			</Box>
			<Divider />
			<Box sx={{ px: 2.5, py: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
				{[
					{ key: 'unresolved' as const, label: 'Not resolved yet', count: counts.unresolved },
					{ key: 'all' as const, label: 'All questions', count: counts.all },
					{
						key: 'needsStaffAnswer' as const,
						label: 'Not answered yet',
						count: counts.needsStaffAnswer,
					},
					{ key: 'resolved' as const, label: 'Already resolved', count: counts.resolved },
				].map((item) => (
					<Button
						key={item.key}
						size='small'
						variant={filter === item.key ? 'contained' : 'outlined'}
						color={
							item.key === 'needsStaffAnswer' && filter === item.key
								? 'warning'
								: 'primary'
						}
						onClick={() => setFilter(item.key)}
						sx={{ fontWeight: 700 }}
					>
						{item.label} ({item.count})
					</Button>
				))}
			</Box>
			<Divider />
			{filteredQuestions.length === 0 ? (
				<Box sx={{ px: 2.5, py: 3 }}>
					<Typography variant='body2' color='text.secondary'>
						No questions in this filter.
					</Typography>
				</Box>
			) : (
				filteredQuestions.map((question, index) => (
					<Box key={question._id}>
						{index > 0 && <Divider />}
						<Box
							onClick={() => openQuestion(question)}
							sx={{
								px: 2.5,
								py: 2,
								cursor: 'pointer',
								bgcolor: questionNeedsStaffAnswer(question)
									? 'rgba(237, 108, 2, 0.06)'
									: 'transparent',
								'&:hover': { bgcolor: 'action.hover' },
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: 1,
									mb: 0.75,
								}}
							>
								<Typography
									variant='subtitle1'
									sx={{ fontWeight: 800, lineHeight: 1.3 }}
								>
									{question.title}
								</Typography>
								<Chip
									icon={
										question.isResolved ? (
											<CheckCircleOutlinedIcon />
										) : (
											<HelpOutlinedIcon />
										)
									}
									label={question.isResolved ? 'Solved' : 'Open'}
									size='small'
									color={question.isResolved ? 'success' : 'default'}
									variant={question.isResolved ? 'filled' : 'outlined'}
									sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
								/>
								{questionNeedsStaffAnswer(question) && (
									<Chip
										icon={<ErrorOutlinedIcon />}
										label='Needs staff answer'
										size='small'
										color='warning'
										variant='filled'
										sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
									/>
								)}
							</Box>
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{
									mb: 1.25,
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{stripHtml(question.description)}
							</Typography>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: 1,
								}}
							>
								<Avatar
									src={question.postedBy.avatar}
									sx={{ width: 22, height: 22, fontSize: 11, bgcolor: 'primary.main' }}
								>
									{question.postedBy.name[0]}
								</Avatar>
								<Typography variant='caption' color='text.secondary'>
									{question.postedBy.name}
								</Typography>
								<Chip
									label={question.postedBy.role}
									size='small'
									sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }}
								/>
								<Typography variant='caption' color='text.secondary'>
									· {formatDateTime(question.createdAt)}
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
									<ForumOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
									<Typography variant='caption' sx={{ fontWeight: 700, color: 'text.secondary' }}>
										{question.answerCount} answer{question.answerCount !== 1 ? 's' : ''}
									</Typography>
								</Box>
							</Box>
						</Box>
					</Box>
				))
			)}
		</Paper>
	);
}
