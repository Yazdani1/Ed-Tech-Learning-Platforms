import type { FC } from 'react';
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	Paper,
	TextField,
	Typography,
} from '@mui/material';

export type QFormState = {
	question: string;
	options: { text: string; explanation: string }[];
	correctOptionIndices: number[];
};

export const blankQForm = (): QFormState => ({
	question: '',
	options: [
		{ text: '', explanation: '' },
		{ text: '', explanation: '' },
		{ text: '', explanation: '' },
		{ text: '', explanation: '' },
	],
	correctOptionIndices: [],
});

export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

interface QuestionFormPanelProps {
	form: QFormState;
	onChange: React.Dispatch<React.SetStateAction<QFormState>>;
	onSubmit: () => void;
	onCancel: () => void;
	submitting: boolean;
	submitLabel: string;
}

const QuestionFormPanel: FC<QuestionFormPanelProps> = ({
	form,
	onChange,
	onSubmit,
	onCancel,
	submitting,
	submitLabel,
}) => {
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
};

export default QuestionFormPanel;
