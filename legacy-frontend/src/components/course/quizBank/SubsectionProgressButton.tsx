import type { FC } from 'react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';

interface SubsectionProgressButtonProps {
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
}

const SubsectionProgressButton: FC<SubsectionProgressButtonProps> = ({
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
}) => {
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
};

export default SubsectionProgressButton;
