import type { FC } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import type { IQuizBank } from '../../../types/index';
import ItemActionMenu from '../../common/ItemActionMenu';
import QuestionFormPanel, { type QFormState, blankQForm, OPTION_LABELS } from './QuestionFormPanel';

interface QuizBankManagePanelProps {
	managingBank: IQuizBank;
	editingBankId: string | null;
	editBankForm: { title: string; description: string };
	editingBankLoading: boolean;
	showAddQuestion: boolean;
	qForm: QFormState;
	addingQ: boolean;
	editingQId: string | null;
	editQForm: QFormState;
	editingQLoading: boolean;
	onSetEditingBankId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditBankForm: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
	onUpdateBank: () => void;
	onSetShowAddQuestion: React.Dispatch<React.SetStateAction<boolean>>;
	onSetQForm: React.Dispatch<React.SetStateAction<QFormState>>;
	onAddQuestion: () => void;
	onSetEditingQId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditQForm: React.Dispatch<React.SetStateAction<QFormState>>;
	onUpdateQuestion: () => void;
	onDeleteQuestion: (bankId: string, qId: string) => void;
}

const QuizBankManagePanel: FC<QuizBankManagePanelProps> = ({
	managingBank,
	editingBankId,
	editBankForm,
	editingBankLoading,
	showAddQuestion,
	qForm,
	addingQ,
	editingQId,
	editQForm,
	editingQLoading,
	onSetEditingBankId,
	onSetEditBankForm,
	onUpdateBank,
	onSetShowAddQuestion,
	onSetQForm,
	onAddQuestion,
	onSetEditingQId,
	onSetEditQForm,
	onUpdateQuestion,
	onDeleteQuestion,
}) => {
	return (
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
								onSetEditBankForm((p) => ({ ...p, title: e.target.value }))
							}
							fullWidth
							size='small'
							sx={{ mb: 1 }}
						/>
						<TextField
							label='Description (optional)'
							value={editBankForm.description}
							onChange={(e) =>
								onSetEditBankForm((p) => ({
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
							<Button size='small' onClick={() => onSetEditingBankId(null)}>
								Cancel
							</Button>
							<Button
								size='small'
								variant='contained'
								onClick={onUpdateBank}
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
								onSetEditingBankId(managingBank._id);
								onSetEditBankForm({
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
							onClick={() => onSetShowAddQuestion((p) => !p)}
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
					onChange={onSetQForm}
					onSubmit={onAddQuestion}
					onCancel={() => {
						onSetShowAddQuestion(false);
						onSetQForm(blankQForm());
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
									onChange={onSetEditQForm}
									onSubmit={onUpdateQuestion}
									onCancel={() => onSetEditingQId(null)}
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
														onSetEditingQId(q._id);
														onSetEditQForm({
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
														onDeleteQuestion(
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
	);
};

export default QuizBankManagePanel;
