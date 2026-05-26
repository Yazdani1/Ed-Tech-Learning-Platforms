import { useEffect, useState } from 'react';
import { Box, Button, Chip, Container, Typography } from '@mui/material';
import { courseService } from '../../services/course.service';
import type { IActiveCourseDiscount } from '../../types/index';

const formatRemaining = (milliseconds: number) => {
	const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
	return `${hours}h ${minutes}m ${seconds}s`;
};

const PublicDiscountBanner= () => {
	const [activeDiscount, setActiveDiscount] = useState<IActiveCourseDiscount | null>(null);
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		courseService
			.getActiveDiscount()
			.then((res) => setActiveDiscount(res.data ?? null))
			.catch(() => setActiveDiscount(null));

		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	if (!activeDiscount) return null;

	const remaining = new Date(activeDiscount.discountEndsAt).getTime() - now;
	if (remaining <= 0) return null;

	return (
		<Box
			sx={{
				background:
					'linear-gradient(90deg, #7f1d1d 0%, #dc2626 28%, #f97316 58%, #facc15 100%)',
				color: 'white',
				borderBottom: '1px solid rgba(127,29,29,0.35)',
				boxShadow: '0 8px 26px rgba(127,29,29,0.18)',
			}}
		>
			<Container
				maxWidth='xl'
				sx={{
					minHeight: { xs: 74, md: 68 },
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 2,
					flexWrap: 'wrap',
					py: 1.25,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
					<Chip
						label={`Up to ${activeDiscount.discountPercent}% off`}
						sx={{
							bgcolor: '#111827',
							color: '#fde68a',
							fontWeight: 950,
							fontSize: '0.95rem',
							height: 34,
							border: '1px solid rgba(255,255,255,0.28)',
						}}
					/>
					<Box>
						<Typography variant='subtitle1' sx={{ fontWeight: 950, lineHeight: 1.15 }}>
							Limited-time course discount is live
						</Typography>
						<Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.88)', fontWeight: 700 }}>
							{activeDiscount.courseCount} course{activeDiscount.courseCount !== 1 ? 's' : ''} included in this offer
						</Typography>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
					<Box
						sx={{
							px: 1.5,
							py: 0.75,
							borderRadius: 1,
							bgcolor: 'rgba(17,24,39,0.82)',
							border: '1px solid rgba(255,255,255,0.22)',
							minWidth: 172,
							textAlign: 'center',
						}}
					>
						<Typography variant='caption' sx={{ display: 'block', color: '#fde68a', fontWeight: 900, lineHeight: 1 }}>
							ENDS IN
						</Typography>
						<Typography variant='h6' sx={{ fontWeight: 950, lineHeight: 1.15, letterSpacing: 0 }}>
							{formatRemaining(remaining)}
						</Typography>
					</Box>
					<Button
						size='medium'
						variant='contained'
						href='/courses'
						sx={{
							minHeight: 38,
							px: 2.25,
							borderRadius: 1,
							fontWeight: 900,
							textTransform: 'none',
							bgcolor: '#111827',
							color: '#fff7ed',
							boxShadow: '0 8px 18px rgba(17,24,39,0.28)',
							'&:hover': { bgcolor: '#020617' },
						}}
					>
						View discounted courses
					</Button>
				</Box>
			</Container>
		</Box>
	);
};

export default PublicDiscountBanner;
