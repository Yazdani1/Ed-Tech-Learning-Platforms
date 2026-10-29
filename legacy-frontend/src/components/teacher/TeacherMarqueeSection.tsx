import { type FC, useState } from 'react';
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

interface TeacherMarqueeCardProps {
	teacher: ITeacher;
	staggeredOffset: number;
}

const TeacherMarqueeCard: FC<TeacherMarqueeCardProps> = ({ teacher, staggeredOffset }) => {
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
					width: 230,
					minHeight: 292,
					flexShrink: 0,
					borderRadius: 1,
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					bgcolor: 'background.paper',
					border: '1px solid',
					borderColor: 'divider',
					transform: `translateY(${staggeredOffset}px)`,
					transition:
						'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
					boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
					'&:hover': {
						transform: `translateY(${staggeredOffset - 12}px) scale(1.04)`,
						boxShadow: '0 20px 48px rgba(15,23,42,0.18)',
						zIndex: 10,
					},
				}}
			>
				<Box
					sx={{
						height: 92,
						background:
							'linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%)',
						position: 'relative',
						flexShrink: 0,
					}}
				>
					<Avatar
						src={teacher.profileImage}
						alt={teacher.name}
						sx={{
							width: 88,
							height: 88,
							position: 'absolute',
							left: '50%',
							bottom: -44,
							transform: 'translateX(-50%)',
							border: '4px solid white',
							bgcolor: 'primary.main',
							fontSize: 32,
							fontWeight: 800,
							boxShadow: '0 10px 26px rgba(15,23,42,0.22)',
						}}
					>
						{teacher.name.charAt(0).toUpperCase()}
					</Avatar>
				</Box>

				<Box
					sx={{
						pt: 6.5,
						px: 2,
						pb: 2,
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						textAlign: 'center',
					}}
				>
					<Typography
						variant='subtitle1'
						sx={{
							fontWeight: 800,
							lineHeight: 1.2,
							mb: 1,
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{teacher.name}
					</Typography>

					{teacher.expertise?.length > 0 && (
						<Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', justifyContent: 'center', mb: 1.25 }}>
							{teacher.expertise.slice(0, 2).map((item) => (
								<Chip
									key={item}
									label={item}
									size='small'
									sx={{
										height: 24,
										fontSize: '0.68rem',
										fontWeight: 700,
										bgcolor: 'rgba(37,99,235,0.08)',
										color: 'primary.main',
									}}
								/>
							))}
							{teacher.expertise.length > 2 && (
								<Chip label={`+${teacher.expertise.length - 2}`} size='small' sx={{ height: 24, fontSize: '0.68rem' }} />
							)}
						</Box>
					)}

					{teacher.bio && (
						<Typography
							variant='body2'
							color='text.secondary'
							sx={{
								lineHeight: 1.55,
								display: '-webkit-box',
								WebkitLineClamp: 3,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{teacher.bio}
						</Typography>
					)}
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
							borderRadius: 1,
							overflow: 'hidden',
							boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
						},
					},
				}}
			>
				<Box
					sx={{
						height: 132,
						background:
							'linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%)',
						position: 'relative',
					}}
				>
					<Avatar
						src={teacher.profileImage}
						alt={teacher.name}
						sx={{
							width: 96,
							height: 96,
							position: 'absolute',
							bottom: -48,
							left: '50%',
							transform: 'translateX(-50%)',
							border: '4px solid white',
							bgcolor: 'primary.main',
							fontSize: 34,
							fontWeight: 800,
							boxShadow: '0 10px 28px rgba(15,23,42,0.24)',
						}}
					>
						{teacher.name.charAt(0).toUpperCase()}
					</Avatar>
				</Box>
				<Box sx={{ pt: 7, px: 3, pb: 3, textAlign: 'center' }}>
					<Typography variant='h6' sx={{ fontWeight: 800, mb: 0.25, lineHeight: 1.2 }}>
						{teacher.name}
					</Typography>
					{teacher.expertise?.length > 0 && (
						<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mb: 2, mt: 1 }}>
							{teacher.expertise.map((exp) => (
								<Chip
									key={exp}
									label={exp}
									size='small'
									sx={{
										fontSize: '0.68rem',
										fontWeight: 700,
										bgcolor: 'rgba(37,99,235,0.08)',
										color: 'primary.main',
									}}
								/>
							))}
						</Box>
					)}
					{teacher.bio && (
						<>
							<Divider sx={{ mb: 2 }} />
							<Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7, textAlign: 'left' }}>
								{teacher.bio}
							</Typography>
						</>
					)}
					{hasSocials && (
						<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
							{teacher.socialLinks?.twitter && (
								<Tooltip title='Twitter'>
									<IconButton size='small' component='a' href={teacher.socialLinks.twitter} target='_blank' sx={{ color: '#1DA1F2', bgcolor: 'rgba(29,161,242,0.1)' }}>
										<TwitterIcon fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
							{teacher.socialLinks?.linkedin && (
								<Tooltip title='LinkedIn'>
									<IconButton size='small' component='a' href={teacher.socialLinks.linkedin} target='_blank' sx={{ color: '#0A66C2', bgcolor: 'rgba(10,102,194,0.1)' }}>
										<LinkedInIcon fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
							{teacher.socialLinks?.website && (
								<Tooltip title='Website'>
									<IconButton size='small' component='a' href={teacher.socialLinks.website} target='_blank' sx={{ color: '#10b981', bgcolor: 'rgba(16,185,129,0.1)' }}>
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
};

interface TeacherMarqueeSectionProps {
	teachers: ITeacher[];
}

const TeacherMarqueeSection: FC<TeacherMarqueeSectionProps> = ({ teachers }) => {
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
};

export default TeacherMarqueeSection;
