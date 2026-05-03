import { useState } from 'react';
import {
	Avatar,
	Box,
	Card,
	Chip,
	Container,
	Divider,
	IconButton,
	Popover,
	Tooltip,
	Typography,
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import type { ITeacher } from '../../types/index';

function TeacherMarqueeCard({
	teacher,
	staggeredOffset,
}: {
	teacher: ITeacher;
	staggeredOffset: number;
}) {
	const hasSocials =
		teacher.socialLinks && Object.values(teacher.socialLinks).some(Boolean);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	return (
		<>
			<Card
				elevation={0}
				onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
				onMouseLeave={() => setAnchorEl(null)}
				sx={{
					width: 200,
					height: 200,
					flexShrink: 0,
					borderRadius: 6,
					overflow: 'hidden',
					position: 'relative',
					transform: `translateY(${staggeredOffset}px)`,
					transition:
						'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
					boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
					'&:hover': {
						transform: `translateY(${staggeredOffset - 15}px) scale(1.15)`,
						boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
						zIndex: 10,
						'& .teacher-overlay': { opacity: 1 },
					},
				}}
			>
				<Box
					component='img'
					src={teacher.profileImage || 'https://placehold.co/400x400?text=Teacher'}
					alt={teacher.name}
					sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
				/>
				<Box
					className='teacher-overlay'
					sx={{
						position: 'absolute',
						inset: 0,
						background: 'rgba(15, 23, 42, 0.85)',
						backdropFilter: 'blur(4px)',
						opacity: 0,
						transition: 'opacity 0.3s ease',
						display: 'flex',
						flexDirection: 'column',
						p: 2,
						color: 'white',
					}}
				>
					<Typography variant='h6' sx={{ fontWeight: 800, lineHeight: 1.1, mb: 0.5 }}>
						{teacher.name}
					</Typography>
					<Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
						{teacher.expertise?.length > 0 && (
							<Typography
								variant='caption'
								sx={{ color: '#a78bfa', fontWeight: 700, display: 'block', mb: 1 }}
							>
								{teacher.expertise[0]}
								{teacher.expertise.length > 1 && ` +${teacher.expertise.length - 1}`}
							</Typography>
						)}
						{teacher.bio && (
							<Typography
								variant='caption'
								sx={{
									color: 'rgba(255,255,255,0.8)',
									display: '-webkit-box',
									WebkitLineClamp: 3,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
									lineHeight: 1.4,
								}}
							>
								{teacher.bio}
							</Typography>
						)}
					</Box>
				</Box>
			</Card>

			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
				transformOrigin={{ vertical: 'center', horizontal: 'left' }}
				disableRestoreFocus
				sx={{ pointerEvents: 'none', ml: 1.5 }}
				slotProps={{
					paper: {
						sx: {
							width: 380,
							borderRadius: 3,
							overflow: 'hidden',
							boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
						},
					},
				}}
			>
				<Box
					sx={{
						height: 160,
						background:
							'linear-gradient(135deg, #0f172a 0%, #7c3aed 60%, #0ea5e9 100%)',
						position: 'relative',
					}}
				>
					<Avatar
						src={teacher.profileImage}
						alt={teacher.name}
						sx={{
							width: 90,
							height: 90,
							position: 'absolute',
							bottom: -45,
							left: 24,
							border: '4px solid white',
							boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
						}}
					/>
				</Box>
				<Box sx={{ pt: 7, px: 3, pb: 3 }}>
					<Typography variant='h6' sx={{ fontWeight: 800, mb: 0.25, lineHeight: 1.2 }}>
						{teacher.name}
					</Typography>
					{teacher.expertise?.length > 0 && (
						<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2, mt: 1 }}>
							{teacher.expertise.map((exp) => (
								<Chip
									key={exp}
									label={exp}
									size='small'
									sx={{
										fontSize: '0.68rem',
										fontWeight: 700,
										bgcolor: 'rgba(124,58,237,0.1)',
										color: '#7c3aed',
									}}
								/>
							))}
						</Box>
					)}
					{teacher.bio && (
						<>
							<Divider sx={{ mb: 2 }} />
							<Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
								{teacher.bio}
							</Typography>
						</>
					)}
					{hasSocials && (
						<Box sx={{ display: 'flex', gap: 1, mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
							{teacher.socialLinks?.twitter && (
								<Tooltip title='Twitter'>
									<IconButton size='small' component='a' href={teacher.socialLinks.twitter} target='_blank' sx={{ color: '#1DA1F2' }}>
										<TwitterIcon fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
							{teacher.socialLinks?.linkedin && (
								<Tooltip title='LinkedIn'>
									<IconButton size='small' component='a' href={teacher.socialLinks.linkedin} target='_blank' sx={{ color: '#0A66C2' }}>
										<LinkedInIcon fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
							{teacher.socialLinks?.website && (
								<Tooltip title='Website'>
									<IconButton size='small' component='a' href={teacher.socialLinks.website} target='_blank' sx={{ color: '#10b981' }}>
										<LanguageIcon fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					)}
				</Box>
			</Popover>
		</>
	);
}

export default function TeacherMarqueeSection({ teachers }: { teachers: ITeacher[] }) {
	if (teachers.length === 0) return null;

	const minCardsNeeded = 15;
	let repeatedTeachers = [...teachers];
	while (repeatedTeachers.length < minCardsNeeded) {
		repeatedTeachers = [...repeatedTeachers, ...teachers];
	}

	const row1 = [...repeatedTeachers, ...repeatedTeachers];
	const reversed = [...repeatedTeachers].reverse();
	const row2 = [...reversed, ...reversed];

	return (
		<Box sx={{ bgcolor: '#f8fafc', overflow: 'hidden', py: { xs: 5, md: 8 } }}>
			<Box
				sx={{
					display: 'flex',
					gap: { xs: 3, md: 6 },
					width: 'max-content',
					animation: 'scrollLeft 50s linear infinite',
					py: 4,
					pl: 4,
					'&:hover': { animationPlayState: 'paused' },
					'@keyframes scrollLeft': {
						'0%': { transform: 'translateX(0)' },
						'100%': { transform: 'translateX(-50%)' },
					},
				}}
			>
				{row1.map((teacher, idx) => (
					<TeacherMarqueeCard
						key={`row1-${teacher._id}-${idx}`}
						teacher={teacher}
						staggeredOffset={idx % 2 === 0 ? -20 : 30}
					/>
				))}
			</Box>

			<Container maxWidth='sm' sx={{ textAlign: 'center', zIndex: 1, my: { xs: 3, md: 5 } }}>
				<Typography
					variant='h3'
					sx={{
						fontWeight: 900,
						mb: 1.5,
						fontSize: { xs: '2rem', md: '2.8rem' },
						color: '#0f172a',
					}}
				>
					Our Instructors
				</Typography>
				<Typography
					variant='subtitle1'
					sx={{
						fontWeight: 800,
						mb: 1,
						fontSize: { xs: '1.1rem', md: '1.35rem' },
						color: '#1e293b',
					}}
				>
					You will find yourself among us
				</Typography>
				<Typography variant='body2' sx={{ color: '#64748b', maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}>
					Dive into a dynamic community where world-class instructors and ambitious learners seamlessly merge.
				</Typography>
			</Container>

			<Box
				sx={{
					display: 'flex',
					gap: { xs: 3, md: 6 },
					width: 'max-content',
					transform: 'translateX(-50%)',
					animation: 'scrollRight 45s linear infinite',
					py: 4,
					pl: 4,
					'&:hover': { animationPlayState: 'paused' },
					'@keyframes scrollRight': {
						'0%': { transform: 'translateX(-50%)' },
						'100%': { transform: 'translateX(0)' },
					},
				}}
			>
				{row2.map((teacher, idx) => (
					<TeacherMarqueeCard
						key={`row2-${teacher._id}-${idx}`}
						teacher={teacher}
						staggeredOffset={idx % 2 === 0 ? 30 : -20}
					/>
				))}
			</Box>
		</Box>
	);
}
