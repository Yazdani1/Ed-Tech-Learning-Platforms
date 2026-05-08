import {
	Box,
	Button,
	Card,
	CardActionArea,
	Chip,
	Popover,
	Skeleton,
	Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ICourse } from '../../types/index';
import { formatBdt, getCoursePriceInfo } from '../../utils/pricing';

const PLAN_COLORS: Record<string, string> = {
	Basic: '#2563eb',
	Premium: '#7c3aed',
	Gold: '#d97706',
	'Quiz Only': '#0891b2',
};

const getYouTubeId = (url: string) => {
	const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
	return m ? m[1] : null;
};

const getIntroVideoUrl = (course: ICourse) => {
	for (const section of course.sections ?? []) {
		const lectures = Array.isArray(section.lectures) ? section.lectures : [];
		for (const lecture of lectures) {
			if (
				lecture.title.toLowerCase().includes('course introduction') &&
				lecture.videoUrl
			) {
				return lecture.videoUrl;
			}
		}
	}

	for (const section of course.sections ?? []) {
		const lectures = Array.isArray(section.lectures) ? section.lectures : [];
		for (const lecture of lectures) {
			if (lecture.isPreview && lecture.videoUrl) return lecture.videoUrl;
		}
	}

	for (const section of course.sections ?? []) {
		const lectures = Array.isArray(section.lectures) ? section.lectures : [];
		for (const lecture of lectures) {
			if (lecture.videoUrl) return lecture.videoUrl;
		}
	}

	return null;
};

interface CourseCardProps {
	course: ICourse;
	basePath?: string;
	appendPath?: string;
	isEnrolled?: boolean;
	learningPath?: string;
}

export function CourseCardSkeleton({ showAction = false }: { showAction?: boolean }) {
	return (
		<Card
			elevation={0}
			sx={{
				borderRadius: 1,
				border: '1px solid',
				borderColor: 'divider',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			<Skeleton
				variant='rectangular'
				animation='wave'
				sx={{ width: '100%', height: 175, flexShrink: 0 }}
			/>
			<Box
				sx={{
					p: 1.5,
					display: 'flex',
					flexDirection: 'column',
					flexGrow: 1,
				}}
			>
				<Skeleton animation='wave' variant='text' sx={{ fontSize: '1rem', width: '92%' }} />
				<Skeleton animation='wave' variant='text' sx={{ fontSize: '1rem', width: '72%', mt: -0.3 }} />
				<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.8rem', width: '58%', mt: 0.5 }} />

				<Box sx={{ flexGrow: 1, minHeight: 34 }} />

				<Skeleton animation='wave' variant='text' sx={{ fontSize: '1.1rem', width: 64 }} />
				{showAction && (
					<Skeleton
						animation='wave'
						variant='rounded'
						sx={{ width: '100%', height: 32, mt: 1.25, borderRadius: 2 }}
					/>
				)}
			</Box>
		</Card>
	);
}

export default function CourseCard({
	course,
	basePath = '/admin/courses',
	appendPath = '',
	isEnrolled = false,
	learningPath,
}: CourseCardProps) {
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const teachers = course.teachers?.map((t) => t.name).join(', ') || '';
	const priceInfo = getCoursePriceInfo(course);
	const learnPath = learningPath ?? `/student/courses/${course._id}/learn`;
	const coursePath = `${basePath}/${course._id}${appendPath}`;
	const introVideoUrl = getIntroVideoUrl(course);
	const introVideoId = introVideoUrl ? getYouTubeId(introVideoUrl) : null;
	const hasSubscriptionPlans =
		course.includedInSubscription && course.allowedSubscriptionPlans.length > 0;

	const openPreview = (element: HTMLElement) => {
		if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		setAnchorEl(element);
	};

	const closePreview = () => {
		closeTimerRef.current = setTimeout(() => setAnchorEl(null), 120);
	};

	const goToCourse = () => {
		setAnchorEl(null);
		navigate(coursePath);
	};

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
					overflow: 'hidden',
					transition: 'box-shadow 0.25s ease, transform 0.25s ease',
					'&:hover': {
						boxShadow: '0 12px 34px rgba(15,23,42,0.16)',
						transform: 'translateY(-3px)',
					},
				}}
				onMouseEnter={(e) => openPreview(e.currentTarget)}
				onMouseLeave={closePreview}
			>
				<CardActionArea
					onClick={() => navigate(coursePath)}
					sx={{
						flexGrow: 1,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'stretch',
					}}
				>
					<Box sx={{ overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
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

						{course.courseType && (
							<Box
								sx={{
									position: 'absolute',
									top: 10,
									left: 10,
									px: 1.25,
									py: 0.5,
									borderRadius: 1,
									background:
										'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)',
									backgroundSize: '250% auto',
									color: 'white',
									transform: 'translateZ(0)',
									boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
									<VerifiedIcon sx={{ fontSize: 13, color: 'white' }} />
									<Typography
										variant='caption'
										sx={{
											fontSize: '0.65rem',
											fontWeight: 800,
											color: 'white',
											letterSpacing: 0.75,
											lineHeight: 1,
											textTransform: 'uppercase',
										}}
									>
										{course.courseType.name}
									</Typography>
								</Box>
							</Box>
						)}
					</Box>

					<Box
						sx={{
							p: 1.5,
							display: 'flex',
							flexDirection: 'column',
							flexGrow: 1,
						}}
					>
						<Typography
							variant='body2'
							sx={{
								fontWeight: 800,
								fontSize: '0.95rem',
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

						{teachers && (
							<Typography
								variant='caption'
								color='text.secondary'
								sx={{ mb: 0.75, display: 'block', lineHeight: 1.3 }}
							>
								{teachers}
							</Typography>
						)}

						<Box sx={{ flexGrow: 1 }} />

						<Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
							<Box sx={{ minWidth: 0 }}>
								{priceInfo.isFree ? (
									<Typography variant='body2' sx={{ fontWeight: 800, fontSize: '1rem', color: 'success.main' }}>
										Free
									</Typography>
								) : (
									<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
										<Typography variant='body2' sx={{ fontWeight: 900, fontSize: '1rem', color: 'text.primary' }}>
											{formatBdt(priceInfo.discountPrice)}
										</Typography>
										{priceInfo.hasDiscount && (
											<>
												<Typography
													variant='body2'
													color='text.secondary'
													sx={{ textDecoration: 'line-through', fontWeight: 800, fontSize: '0.9rem' }}
												>
													{formatBdt(priceInfo.listPrice)}
												</Typography>
												<Chip
													label={`${priceInfo.discountPercent}% off`}
													size='small'
													color='success'
													sx={{ height: 24, fontSize: '0.75rem', fontWeight: 800 }}
												/>
											</>
										)}
									</Box>
								)}
							</Box>
							<Chip
								label={course.category?.name ?? 'Course'}
								size='small'
								variant='outlined'
								sx={{ maxWidth: 118, fontWeight: 700 }}
							/>
						</Box>

						{isEnrolled && (
							<Button
								fullWidth
								variant='contained'
								color='success'
								size='small'
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									navigate(learnPath);
								}}
								sx={{
									mt: 1.25,
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: 1,
								}}
							>
								Go to this course
							</Button>
						)}
					</Box>
				</CardActionArea>
			</Card>

			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
				transformOrigin={{ vertical: 'center', horizontal: 'left' }}
				disableRestoreFocus
				sx={{ pointerEvents: 'none', ml: 1 }}
				slotProps={{
					paper: {
						onMouseEnter: () => {
							if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
						},
						onMouseLeave: closePreview,
						sx: {
							pointerEvents: 'auto',
							borderRadius: 1,
							overflow: 'hidden',
							boxShadow: '0 22px 60px rgba(15,23,42,0.22)',
							border: '1px solid',
							borderColor: 'divider',
						},
					},
				}}
			>
				<Box sx={{ width: 360, maxWidth: 'calc(100vw - 32px)', bgcolor: 'background.paper' }}>
					<Box
						sx={{
							position: 'relative',
							aspectRatio: '16 / 9',
							bgcolor: 'grey.900',
							overflow: 'hidden',
						}}
					>
						{introVideoId ? (
							<Box
								component='iframe'
								src={`https://www.youtube.com/embed/${introVideoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1`}
								title={`${course.title} intro video`}
								allow='autoplay; encrypted-media; picture-in-picture'
								sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
							/>
						) : introVideoUrl ? (
							<Box
								component='video'
								src={introVideoUrl}
								autoPlay
								muted
								playsInline
								controls
								preload='metadata'
								sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
							/>
						) : (
							<Box
								component='img'
								src={course.coverImage ?? 'https://placehold.co/640x360?text=Course+Preview'}
								alt={course.title}
								sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
							/>
						)}
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'flex-end',
								p: 1.5,
								background:
									'linear-gradient(180deg, transparent 45%, rgba(15,23,42,0.72) 100%)',
								pointerEvents: 'none',
							}}
						>
							<Chip
								icon={<PlayCircleIcon />}
								label={introVideoUrl ? 'Play intro preview' : 'Course preview'}
								size='small'
								sx={{
									color: 'white',
									bgcolor: 'rgba(15,23,42,0.76)',
									border: '1px solid rgba(255,255,255,0.2)',
									'& .MuiChip-icon': { color: 'white' },
								}}
							/>
						</Box>
					</Box>

					<Box sx={{ p: 2 }}>
						<Typography
							variant='subtitle1'
							sx={{
								fontWeight: 800,
								lineHeight: 1.25,
								mb: 1,
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{course.title}
						</Typography>

						<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.25 }}>
							{course.category && <Chip label={course.category.name} size='small' />}
							{course.courseType && (
								<Chip label={course.courseType.name} size='small' variant='outlined' />
							)}
						</Box>

						{course.description && (
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{
									mb: 1.5,
									lineHeight: 1.55,
									display: '-webkit-box',
									WebkitLineClamp: 3,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{course.description}
							</Typography>
						)}

						{course.whatYouWillLearn?.length > 0 && (
							<Box sx={{ mb: 1.75 }}>
								<Typography
									variant='caption'
									sx={{
										fontWeight: 800,
										textTransform: 'uppercase',
										letterSpacing: 0.5,
									}}
								>
									What you'll learn
								</Typography>
								{course.whatYouWillLearn.slice(0, 3).map((item, i) => (
									<Typography key={i} variant='body2' sx={{ mt: 0.5, lineHeight: 1.35 }}>
										- {item}
									</Typography>
								))}
							</Box>
						)}

						{hasSubscriptionPlans && (
							<Box
								sx={{
									p: 1.25,
									mb: 1.75,
									borderRadius: 1,
									bgcolor: 'grey.50',
									border: '1px solid',
									borderColor: 'divider',
								}}
							>
								<Typography
									variant='caption'
									sx={{ display: 'block', fontWeight: 800, mb: 0.75 }}
								>
									Included with subscription
								</Typography>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{course.allowedSubscriptionPlans.map((plan) => (
										<Box
											key={plan}
											sx={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 0.4,
												px: 0.75,
												py: 0.35,
												borderRadius: 0.75,
												bgcolor: PLAN_COLORS[plan] ?? '#7c3aed',
												color: 'white',
											}}
										>
											<CardMembershipIcon sx={{ fontSize: 12 }} />
											<Typography
												variant='caption'
												sx={{ fontSize: '0.68rem', fontWeight: 800, lineHeight: 1 }}
											>
												{plan}
											</Typography>
										</Box>
									))}
								</Box>
							</Box>
						)}

						<Button
							fullWidth
							variant='contained'
							endIcon={<ArrowForwardIcon />}
							onClick={goToCourse}
							sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1 }}
						>
							Watch now
						</Button>
					</Box>
				</Box>
			</Popover>
		</>
	);
}
