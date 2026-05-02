import { Box, Card, CardActionArea, Chip, Popover, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ICourse } from '../../types/index';

const PLAN_COLORS: Record<string, string> = {
	Basic: '#2563eb',
	Premium: '#7c3aed',
	Gold: '#d97706',
	'Quiz Only': '#0891b2',
};

interface CourseCardProps {
	course: ICourse;
	basePath?: string;
}

export default function CourseCard({ course, basePath = '/admin/courses' }: CourseCardProps) {
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const teachers = course.teachers?.map((t) => t.name).join(', ') || '';
	const priceLabel =
		course.pricing === 'Free'
			? 'Free'
			: course.price != null
				? `$${course.price.toFixed(2)}`
				: 'Paid';

	return (
		<>
			<Card
				elevation={0}
				sx={{
					borderRadius: 1,
					border: '1px solid',
					borderColor: 'divider',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					cursor: 'pointer',
					transition: 'box-shadow 0.25s ease, transform 0.25s ease',
					'&:hover': {
						boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
						transform: 'translateY(-2px)',
					},
				}}
				onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
				onMouseLeave={() => setAnchorEl(null)}
			>
				<CardActionArea
					onClick={() => navigate(`${basePath}/${course._id}`)}
					sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
				>
					{/* Cover image */}
					<Box sx={{ overflow: 'hidden', flexShrink: 0 }}>
						<Box
							component='img'
							src={course.coverImage ?? 'https://placehold.co/400x200?text=No+Image'}
							alt={course.title}
							sx={{
								width: '100%',
								height: 175,
								objectFit: 'cover',
								display: 'block',
								transition: 'transform 0.3s ease',
								'&:hover': { transform: 'scale(1.04)' },
							}}
						/>
					</Box>

					{/* Card body */}
					<Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
						{/* Title — 2-line clamp */}
						<Typography
							sx={{
								fontWeight: 700,
								fontSize: '0.925rem',
								lineHeight: 1.35,
								mb: 0.5,
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{course.title}
						</Typography>

						{/* Teacher */}
						{teachers && (
							<Typography
								variant='caption'
								color='text.secondary'
								sx={{ mb: 0.75, display: 'block', lineHeight: 1.3 }}
							>
								{teachers}
							</Typography>
						)}

						{/* Spacer */}
						<Box sx={{ flexGrow: 1 }} />

						{/* Price */}
						<Typography
							sx={{
								fontWeight: 700,
								fontSize: '1rem',
								color: course.pricing === 'Free' ? 'success.main' : 'text.primary',
								mb: course.includedInSubscription ? 1 : 0,
							}}
						>
							{priceLabel}
						</Typography>

						{/* Subscription plan badges */}
						{course.includedInSubscription && course.allowedSubscriptionPlans.length > 0 && (
							<Box>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
									{course.allowedSubscriptionPlans.map((plan) => (
										<Box
											key={plan}
											sx={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 0.4,
												px: 0.75,
												py: 0.3,
												borderRadius: 0.75,
												bgcolor: PLAN_COLORS[plan] ?? '#7c3aed',
												color: 'white',
											}}
										>
											<VerifiedIcon sx={{ fontSize: 11 }} />
											<Typography sx={{ fontSize: '0.68rem', fontWeight: 700, lineHeight: 1 }}>
												{plan}
											</Typography>
										</Box>
									))}
									<Typography
										sx={{
											fontSize: '0.7rem',
											fontWeight: 600,
											background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											lineHeight: 1,
										}}
									>
										included free
									</Typography>
								</Box>
							</Box>
						)}
					</Box>
				</CardActionArea>
			</Card>

			{/* Hover popover preview */}
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
				transformOrigin={{ vertical: 'center', horizontal: 'left' }}
				disableRestoreFocus
				sx={{ pointerEvents: 'none', ml: 1 }}
			>
				<Box sx={{ p: 2.5, maxWidth: 300 }}>
					<Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 0.5 }}>
						{course.title}
					</Typography>
					{course.category && (
						<Chip label={course.category.name} size='small' sx={{ mb: 1 }} />
					)}
					{course.description && (
						<Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
							{course.description.slice(0, 140)}{course.description.length > 140 ? '…' : ''}
						</Typography>
					)}
					{course.whatYouWillLearn?.length > 0 && (
						<Box>
							<Typography variant='caption' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
								What you'll learn
							</Typography>
							{course.whatYouWillLearn.slice(0, 3).map((item, i) => (
								<Typography key={i} variant='body2' sx={{ mt: 0.4 }}>
									• {item}
								</Typography>
							))}
						</Box>
					)}
				</Box>
			</Popover>
		</>
	);
}
