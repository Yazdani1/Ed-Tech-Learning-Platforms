import type { FC } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { IQuizQuestion } from '../../../types/index';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

function arraysEqualSorted(a: number[], b: number[]): boolean {
	if (a.length !== b.length) return false;
	const sa = [...a].sort((x, y) => x - y);
	const sb = [...b].sort((x, y) => x - y);
	return sa.every((v, i) => v === sb[i]);
}

interface QuestionPracticeCardProps {
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
}

const QuestionPracticeCard: FC<QuestionPracticeCardProps> = ({
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
}) => {
	const isCorrectAnswer =
		isChecked &&
		arraysEqualSorted(selectedOptions, question.correctOptionIndices);
	const multipleCorrect = question.correctOptionIndices.length > 1;

	return (
		<Paper variant='outlined' sx={{ p: 2.5, borderRadius: 0.5 }}>
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
};

export default QuestionPracticeCard;
