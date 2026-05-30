import { type FC, useEffect, useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	LinearProgress,
	Typography,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { studyScheduleService } from '../../services/studySchedule.service';
import type { IStudySchedule } from '../../types/index';
import { formatSeconds, playAlarm } from '../../utils/alarm';

interface StudyTimerCardProps {
	timer: IStudySchedule;
	onComplete: (id: string) => void;
	onRemove: (id: string) => void;
}

const StudyTimerCard: FC<StudyTimerCardProps> = ({ timer, onComplete, onRemove }) => {
	const totalDuration = timer.duration ?? 0;
	const initialLeft = Math.max(0, totalDuration - (timer.elapsedSeconds ?? 0));

	const [timeLeft, setTimeLeft] = useState(initialLeft);
	const [isRunning, setIsRunning] = useState(timer.status === 'active' && initialLeft > 0);
	const [isDone, setIsDone] = useState(initialLeft === 0);
	const [saving, setSaving] = useState(false);

	const timeLeftRef = useRef(initialLeft);

	const onCompleteRef = useRef(onComplete);
	useEffect(() => {
		onCompleteRef.current = onComplete;
	});

	const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

	useEffect(() => {
		if (!isRunning) return;
		const interval = setInterval(() => {
			const next = timeLeftRef.current - 1;
			timeLeftRef.current = next;
			setTimeLeft(next);
			if (next <= 0) {
				clearInterval(interval);
				setIsRunning(false);
				setIsDone(true);
				playAlarm();
				void studyScheduleService
					.update(timer._id, {
						status: 'completed',
						completedAt: new Date().toISOString(),
						elapsedSeconds: totalDuration,
					})
					.then(() => onCompleteRef.current(timer._id));
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [isRunning, timer._id, totalDuration]);

	const handlePause = async () => {
		setSaving(true);
		try {
			setIsRunning(false);
			await studyScheduleService.update(timer._id, {
				status: 'paused',
				elapsedSeconds: totalDuration - timeLeftRef.current,
			});
		} finally {
			setSaving(false);
		}
	};

	const handleResume = async () => {
		setSaving(true);
		try {
			setIsRunning(true);
			await studyScheduleService.update(timer._id, { status: 'active' });
		} finally {
			setSaving(false);
		}
	};

	const handleReset = async () => {
		setSaving(true);
		try {
			setIsRunning(false);
			setIsDone(false);
			setTimeLeft(totalDuration);
			timeLeftRef.current = totalDuration;
			await studyScheduleService.update(timer._id, { status: 'active', elapsedSeconds: 0 });
		} finally {
			setSaving(false);
		}
	};

	const handleStop = async () => {
		setSaving(true);
		try {
			setIsRunning(false);
			await studyScheduleService.update(timer._id, { status: 'cancelled' });
			onRemove(timer._id);
		} finally {
			setSaving(false);
		}
	};

	const clockColor = isDone ? '#ff4d4d' : '#00e676';
	const glowColor = isDone ? 'rgba(255,77,77,0.5)' : 'rgba(0,230,118,0.35)';
	const statusLabel = isDone ? 'COMPLETED' : isRunning ? 'RUNNING' : 'PAUSED';

	return (
		<Card
			sx={{
				mb: 2,
				border: '1px solid',
				borderColor: isDone ? 'error.light' : isRunning ? 'success.light' : 'divider',
				transition: 'border-color 0.3s',
			}}
		>
			<CardContent>
				{/* Header */}
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
					<Box>
						<Typography variant='h6' sx={{ fontWeight: 700 }}>
							{timer.title}
						</Typography>
						{timer.description && (
							<Typography variant='body2' color='text.secondary'>
								{timer.description}
							</Typography>
						)}
					</Box>
					<Chip
						label={statusLabel}
						size='small'
						color={isDone ? 'error' : isRunning ? 'success' : 'default'}
						sx={{ fontWeight: 700, letterSpacing: 1 }}
					/>
				</Box>

				{/* Digital clock */}
				<Box
					sx={{
						background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
						borderRadius: 2,
						py: 3,
						px: 2,
						my: 2,
						textAlign: 'center',
						border: `1px solid ${isDone ? 'rgba(255,77,77,0.25)' : 'rgba(0,230,118,0.2)'}`,
						boxShadow: `0 0 24px ${glowColor}`,
					}}
				>
					<Typography
						sx={{
							fontFamily: '"Courier New", Courier, monospace',
							fontSize: { xs: '2.8rem', sm: '3.8rem' },
							fontWeight: 700,
							color: clockColor,
							textShadow: `0 0 18px ${glowColor}`,
							letterSpacing: '0.08em',
							lineHeight: 1,
						}}
					>
						{formatSeconds(timeLeft)}
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
						{['HH', 'MM', 'SS'].map((label) => (
							<Typography
								key={label}
								variant='caption'
								sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: 2 }}
							>
								{label}
							</Typography>
						))}
					</Box>
				</Box>

				{/* Progress bar */}
				<LinearProgress
					variant='determinate'
					value={Math.min(100, progress)}
					sx={{
						height: 6,
						borderRadius: 3,
						mb: 2,
						bgcolor: 'rgba(0,0,0,0.1)',
						'& .MuiLinearProgress-bar': {
							background: isDone
								? 'linear-gradient(90deg,#f44336,#e91e63)'
								: 'linear-gradient(90deg,#00e676,#00bcd4)',
							borderRadius: 3,
						},
					}}
				/>

				{/* Action buttons */}
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
					{isDone ? (
						<Chip
							icon={<CheckCircleIcon />}
							label='Timer completed!'
							color='success'
							variant='outlined'
						/>
					) : isRunning ? (
						<Button
							variant='contained'
							color='warning'
							startIcon={<PauseIcon />}
							onClick={() => void handlePause()}
							disabled={saving}
							size='small'
						>
							Pause
						</Button>
					) : (
						<Button
							variant='contained'
							color='success'
							startIcon={<PlayArrowIcon />}
							onClick={() => void handleResume()}
							disabled={saving}
							size='small'
						>
							{timer.elapsedSeconds && timer.elapsedSeconds > 0 ? 'Resume' : 'Start'}
						</Button>
					)}

					{!isDone && (
						<Button
							variant='outlined'
							startIcon={<RestartAltIcon />}
							onClick={() => void handleReset()}
							disabled={saving}
							size='small'
						>
							Reset
						</Button>
					)}

					<Button
						variant='outlined'
						color='error'
						startIcon={<StopIcon />}
						onClick={() => void handleStop()}
						disabled={saving}
						size='small'
					>
						{isDone ? 'Dismiss' : 'Stop'}
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
};

export default StudyTimerCard;
