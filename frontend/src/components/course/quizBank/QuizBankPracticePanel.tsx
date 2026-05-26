import type { FC } from 'react';
import {
	Box,
	Chip,
	CircularProgress,
	Collapse,
	IconButton,
	Paper,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { IQuizBank, IQuizQuestion } from '../../../types/index';
import AppPagination from '../../common/AppPagination';
import QuestionPracticeCard from './QuestionPracticeCard';
import type { Subsection, LocalAnswer } from './QuizBankSidebar';

interface QuizBankPracticePanelProps {
	selectedBank: IQuizBank;
	selectedSubsection: Subsection;
	activeQuestions: IQuizQuestion[];
	currentQuestion: IQuizQuestion | null;
	currentPage: number;
	selectedOptions: number[];
	isChecked: boolean;
	submitting: boolean;
	attemptLoading: boolean;
	totalQ: number;
	correctCount: number;
	incorrectCount: number;
	progressPct: number;
	bankStatsOpen: boolean;
	courseAnswers: Map<string, LocalAnswer>;
	onSetBankStatsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	onSetCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	onSetSelectedOptions: React.Dispatch<React.SetStateAction<number[]>>;
	onSetIsChecked: React.Dispatch<React.SetStateAction<boolean>>;
	onToggleOption: (idx: number) => void;
	onCheck: () => void;
	onNext: () => void;
	onSkip: () => void;
	onResetAttempt: () => void;
}

const QuizBankPracticePanel: FC<QuizBankPracticePanelProps> = ({
	selectedBank,
	selectedSubsection,
	activeQuestions,
	currentQuestion,
	currentPage,
	selectedOptions,
	isChecked,
	submitting,
	attemptLoading,
	totalQ,
	correctCount,
	incorrectCount,
	progressPct,
	bankStatsOpen,
	courseAnswers,
	onSetBankStatsOpen,
	onSetCurrentPage,
	onSetSelectedOptions,
	onSetIsChecked,
	onToggleOption,
	onCheck,
	onNext,
	onSkip,
	onResetAttempt,
}) => {
	return (
		<Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 740, mx: 'auto' }}>
			{/* Header */}
			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
					<Box>
						<Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
							{selectedBank.title}
						</Typography>
						{selectedBank.description && (
							<Typography variant='body2' color='text.secondary'>
								{selectedBank.description}
							</Typography>
						)}
					</Box>
					{(correctCount + incorrectCount) > 0 && (
						<Tooltip title='Reset all answers for this quiz bank' placement='left'>
							<IconButton
								size='small'
								onClick={onResetAttempt}
								sx={{ flexShrink: 0, mt: 0.5, color: 'text.primary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
							>
								<RefreshIcon sx={{ fontSize: 18 }} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
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
				<Box sx={{ mb: 1.5 }}>
					<CircularProgress size={20} />
				</Box>
			) : (
				<Paper
					variant='outlined'
					sx={{
						mb: 2,
						borderRadius: 0.5,
						bgcolor: 'background.paper',
						boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
						overflow: 'hidden',
					}}
				>
					<Box
						onClick={() => onSetBankStatsOpen((p) => !p)}
						sx={{
							p: 1.5,
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							cursor: 'pointer',
							'&:hover': { bgcolor: 'action.hover' },
							borderBottom: bankStatsOpen ? '1px solid' : 'none',
							borderColor: 'divider',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, flexWrap: 'wrap' }}>
							{[
								{ label: 'Total', value: totalQ, color: 'text.primary' },
								{ label: 'Answered', value: correctCount + incorrectCount, color: 'primary.main' },
								{ label: 'Correct', value: correctCount, color: 'success.main' },
								{ label: 'Incorrect', value: incorrectCount, color: 'error.main' },
								{ label: 'Not Answered Yet', value: totalQ - (correctCount + incorrectCount), color: 'warning.main' },
							].map(({ label, value, color }, i, arr) => (
								<Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
						<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, flexShrink: 0 }}>
							{progressPct}% Accuracy
						</Typography>
						<ExpandMoreIcon
							sx={{
								fontSize: 18,
								color: 'text.secondary',
								transition: 'transform 0.2s',
								transform: bankStatsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
							}}
						/>
					</Box>

					<Collapse in={bankStatsOpen}>
						<Box sx={{ p: 2 }}>
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
						</Box>
					</Collapse>
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
						<QuestionPracticeCard
							question={currentQuestion}
							questionNumber={currentPage + 1}
							totalQuestions={activeQuestions.length}
							selectedOptions={selectedOptions}
							isChecked={isChecked}
							submitting={submitting}
							onToggleOption={onToggleOption}
							onCheck={onCheck}
							onNext={onNext}
							onSkip={onSkip}
							isLastQuestion={currentPage >= activeQuestions.length - 1}
						/>
					)}

					{activeQuestions.length > 1 && (
						<AppPagination
							page={currentPage + 1}
							totalPages={activeQuestions.length}
							totalItems={activeQuestions.length}
							pageSize={1}
							onChange={(p) => {
								onSetCurrentPage(p - 1);
								onSetSelectedOptions([]);
								onSetIsChecked(false);
							}}
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
					)}
				</>
			)}
		</Box>
	);
};

export default QuizBankPracticePanel;
