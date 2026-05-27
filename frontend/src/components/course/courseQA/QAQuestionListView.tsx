import { type FC } from 'react';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import type { IQuestion } from '../../../types/index';
import RichTextEditor from '../RichTextEditor';
import ItemActionMenu from '../../common/ItemActionMenu';
import { formatDateTime } from '../../../utils/dateTime';
import AppPagination from '../../common/AppPagination';
import YouBadge from '../../common/YouBadge';

type QuestionFilter = 'all' | 'needsStaffAnswer' | 'unresolved' | 'resolved';

const PAGE_SIZE = 8;

interface QAQuestionListViewProps {
	questions: IQuestion[];
	qaLoading: boolean;
	canPost: boolean;
	userId: string;
	showAskForm: boolean;
	setShowAskForm: React.Dispatch<React.SetStateAction<boolean>>;
	askForm: { title: string; description: string };
	setAskForm: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
	askPosting: boolean;
	askEditorKey: number;
	setAskEditorKey: React.Dispatch<React.SetStateAction<number>>;
	questionFilter: QuestionFilter;
	setQuestionFilter: React.Dispatch<React.SetStateAction<QuestionFilter>>;
	filteredQuestions: IQuestion[];
	questionFilterCounts: { all: number; needsStaffAnswer: number; unresolved: number; resolved: number };
	currentPage: number;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	editingQuestionId: string | null;
	setEditingQuestionId: React.Dispatch<React.SetStateAction<string | null>>;
	editingQuestionForm: { title: string; description: string };
	setEditingQuestionForm: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
	questionUpdating: boolean;
	resolvingQuestionId: string | null;
	canEdit: (ownerId: string) => boolean;
	canResolve: (question: IQuestion) => boolean;
	questionNeedsStaffAnswer: (question: IQuestion) => boolean;
	onAskQuestion: () => Promise<void>;
	onViewQuestion: (question: IQuestion) => Promise<void>;
	onUpvoteQuestion: (id: string) => void;
	onResolveQuestion: (question: IQuestion, isResolved: boolean) => Promise<void>;
	onDeleteQuestion: (id: string) => Promise<void>;
	onUpdateQuestion: () => Promise<void>;
	onStartEditQuestion: (question: IQuestion) => void;
}

const QAQuestionListView: FC<QAQuestionListViewProps> = ({
	questions,
	qaLoading,
	canPost,
	userId,
	showAskForm,
	setShowAskForm,
	askForm,
	setAskForm,
	askPosting,
	askEditorKey,
	setAskEditorKey,
	questionFilter,
	setQuestionFilter,
	filteredQuestions,
	questionFilterCounts,
	currentPage,
	setCurrentPage,
	editingQuestionId,
	setEditingQuestionId,
	editingQuestionForm,
	setEditingQuestionForm,
	questionUpdating,
	resolvingQuestionId,
	canEdit,
	canResolve,
	questionNeedsStaffAnswer,
	onAskQuestion,
	onViewQuestion,
	onUpvoteQuestion,
	onResolveQuestion,
	onDeleteQuestion,
	onUpdateQuestion,
	onStartEditQuestion,
}) => {
	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant='h5' sx={{ fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
					Q &amp; A
					{!qaLoading && (
						<Typography component='span' variant='body2' color='text.secondary' sx={{ fontWeight: 400 }}>
							{questions.length} question{questions.length !== 1 ? 's' : ''}
						</Typography>
					)}
				</Typography>
				{canPost && (
					<Button variant='contained' startIcon={<AddIcon />} onClick={() => setShowAskForm((p) => !p)}>
						Ask a Question
					</Button>
				)}
			</Box>

			{canPost && showAskForm && (
				<Paper variant='outlined' sx={{ p: 2.5, mb: 3, borderRadius: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
					<Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.5 }}>New Question</Typography>
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
					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
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
							onClick={() => void onAskQuestion()}
							disabled={askPosting}
						>
							{askPosting ? <CircularProgress size={16} color='inherit' /> : 'Post Question'}
						</Button>
					</Box>
				</Paper>
			)}

			{!qaLoading && questions.length > 0 && (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
					{[
						{ key: 'unresolved' as const, label: 'Not resolved yet', count: questionFilterCounts.unresolved },
						{ key: 'all' as const, label: 'All questions', count: questionFilterCounts.all },
						{ key: 'needsStaffAnswer' as const, label: 'Not answered yet', count: questionFilterCounts.needsStaffAnswer },
						{ key: 'resolved' as const, label: 'Already resolved', count: questionFilterCounts.resolved },
					].map((filter) => (
						<Button
							key={filter.key}
							size='small'
							variant={questionFilter === filter.key ? 'contained' : 'outlined'}
							color={filter.key === 'needsStaffAnswer' && questionFilter === filter.key ? 'warning' : 'primary'}
							onClick={() => setQuestionFilter(filter.key)}
							sx={{ fontWeight: 700 }}
						>
							{filter.label} ({filter.count})
						</Button>
					))}
				</Box>
			)}

			{qaLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress />
				</Box>
			) : questions.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 8 }}>
					<ForumOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
					<Typography variant='h6' color='text.secondary' sx={{ fontWeight: 600 }}>No questions yet</Typography>
					{canPost && (
						<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
							Be the first to ask a question!
						</Typography>
					)}
				</Box>
			) : filteredQuestions.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 6 }}>
					<Typography variant='subtitle1' color='text.secondary' sx={{ fontWeight: 700 }}>
						No questions in this filter
					</Typography>
				</Box>
			) : (
				<Box>
					<Paper variant='outlined' sx={{ borderRadius: 0.5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
						{filteredQuestions
							.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
							.map((q, index) => {
								const hasUpvoted = q.upvotes.includes(userId);
								const needsStaffAnswer = questionNeedsStaffAnswer(q);
								return (
									<Box key={q._id}>
										{index > 0 && <Divider />}
										<Box
											onClick={editingQuestionId === q._id ? undefined : () => void onViewQuestion(q)}
											sx={{
												p: 2.5,
												bgcolor: needsStaffAnswer ? 'rgba(237, 108, 2, 0.06)' : 'transparent',
												cursor: editingQuestionId === q._id ? 'default' : 'pointer',
												transition: 'background-color 0.2s',
												...(editingQuestionId === q._id ? {} : { '&:hover': { bgcolor: 'action.hover' } }),
											}}
										>
											<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
												<Box
													sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 44, flexShrink: 0 }}
													onClick={(e) => { e.stopPropagation(); void onUpvoteQuestion(q._id); }}
												>
													{hasUpvoted ? (
														<ThumbUpIcon sx={{ fontSize: 20, color: 'primary.main' }} />
													) : (
														<ThumbUpOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
													)}
													<Typography variant='caption' sx={{ fontWeight: 700, color: hasUpvoted ? 'primary.main' : 'text.secondary' }}>
														{q.upvotes.length}
													</Typography>
												</Box>

												<Box sx={{ flex: 1, minWidth: 0 }}>
													{editingQuestionId === q._id ? (
														<Box onClick={(e) => e.stopPropagation()} sx={{ mb: 1.5 }}>
															<TextField
																label='Title'
																value={editingQuestionForm.title}
																onChange={(e) => setEditingQuestionForm((p) => ({ ...p, title: e.target.value }))}
																fullWidth
																size='small'
																sx={{ mb: 1.5 }}
															/>
															<RichTextEditor
																value={editingQuestionForm.description}
																onChange={(html) => setEditingQuestionForm((p) => ({ ...p, description: html }))}
																placeholder='Update your question...'
																minHeight={120}
															/>
														</Box>
													) : (
														<>
															<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
																<Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3 }}>
																	{q.title}
																</Typography>
																<Chip
																	icon={q.isResolved ? <CheckCircleOutlinedIcon /> : <HelpOutlinedIcon />}
																	label={q.isResolved ? 'Solved' : 'Open'}
																	size='small'
																	color={q.isResolved ? 'success' : 'default'}
																	variant={q.isResolved ? 'filled' : 'outlined'}
																	sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
																/>
																{questionNeedsStaffAnswer(q) && (
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
																sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
																dangerouslySetInnerHTML={{ __html: q.description.replace(/<[^>]*>/g, ' ').trim() }}
															/>
														</>
													)}
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
															<Avatar src={q.postedBy.avatar} sx={{ width: 20, height: 20, fontSize: 10, bgcolor: 'primary.main' }}>
																{q.postedBy.name[0]}
															</Avatar>
															<Typography variant='caption' color='text.secondary' noWrap>{q.postedBy.name}</Typography>
															{userId === q.postedBy._id && <YouBadge />}
															<Chip label={q.postedBy.role} size='small' sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, px: 0.25, flexShrink: 0 }} />
															<Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0 }}>
																· {formatDateTime(q.createdAt)}
															</Typography>
														</Box>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
															<ForumOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
															<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary' }}>
																{q.answerCount} answer{q.answerCount !== 1 ? 's' : ''}
															</Typography>
															<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary' }}>
																· {q.staffAnswerCount} staff
															</Typography>
															{editingQuestionId === q._id ? (
																<Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 1 }}>
																	<Button size='small' onClick={() => setEditingQuestionId(null)}>Cancel</Button>
																	<Button
																		size='small'
																		variant='contained'
																		onClick={() => void onUpdateQuestion()}
																		disabled={questionUpdating || !editingQuestionForm.title.trim() || !editingQuestionForm.description.trim()}
																	>
																		{questionUpdating ? <CircularProgress size={16} color='inherit' /> : 'Update'}
																	</Button>
																</Box>
															) : (
																<>
																	{canResolve(q) && (
																		<Button
																			size='small'
																			variant={q.isResolved ? 'outlined' : 'contained'}
																			color={q.isResolved ? 'inherit' : 'success'}
																			onClick={(e) => { e.stopPropagation(); void onResolveQuestion(q, !q.isResolved); }}
																			disabled={resolvingQuestionId === q._id}
																			sx={{ fontWeight: 700, py: 0.25 }}
																		>
																			{resolvingQuestionId === q._id ? (
																				<CircularProgress size={14} color='inherit' />
																			) : q.isResolved ? 'Not solved' : 'Mark solved'}
																		</Button>
																	)}
																	{canEdit(q.postedBy._id) && (
																		<ItemActionMenu
																			actions={[
																				{
																					label: 'Edit',
																					icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
																					onClick: () => onStartEditQuestion(q),
																				},
																				{
																					label: 'Delete',
																					color: 'error',
																					icon: <DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
																					onClick: () => void onDeleteQuestion(q._id),
																				},
																			]}
																		/>
																	)}
																</>
															)}
														</Box>
													</Box>
												</Box>
											</Box>
										</Box>
									</Box>
								);
							})}
					</Paper>
					<AppPagination
						page={currentPage}
						totalPages={Math.ceil(filteredQuestions.length / PAGE_SIZE)}
						totalItems={filteredQuestions.length}
						pageSize={PAGE_SIZE}
						onChange={setCurrentPage}
						align='center'
					/>
				</Box>
			)}
		</Box>
	);
};

export default QAQuestionListView;
