import { useEffect, useState } from 'react';
import {
	Avatar,
	Box,
	Card,
	Chip,
	CircularProgress,
	Container,
	Grid,
	IconButton,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import SchoolIcon from '@mui/icons-material/School';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { teacherService } from '../../services/teacher.service';
import type { ITeacher } from '../../types/index';

function TeacherProfileCard({ teacher }: { teacher: ITeacher }) {
	const hasSocials =
		teacher.socialLinks && Object.values(teacher.socialLinks).some(Boolean);

	return (
		<Card
			elevation={0}
			sx={{
				height: '100%',
				borderRadius: 2,
				border: '1px solid',
				borderColor: 'divider',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
				transition: 'transform 0.25s ease, box-shadow 0.25s ease',
				'&:hover': {
					transform: 'translateY(-4px)',
					boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
				},
			}}
		>
			<Box
				sx={{
					height: 108,
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
						left: '50%',
						bottom: -48,
						transform: 'translateX(-50%)',
						border: '4px solid white',
						bgcolor: 'primary.main',
						fontSize: 34,
						fontWeight: 800,
						boxShadow: '0 10px 28px rgba(15,23,42,0.2)',
					}}
				>
					{teacher.name.charAt(0).toUpperCase()}
				</Avatar>
			</Box>

			<Box
				sx={{
					pt: 7,
					px: 3,
					pb: 3,
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					textAlign: 'center',
				}}
			>
				<Typography variant='h6' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
					{teacher.name}
				</Typography>

				{teacher.expertise?.length > 0 && (
					<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mt: 1.5 }}>
						{teacher.expertise.slice(0, 4).map((item) => (
							<Chip
								key={item}
								label={item}
								size='small'
								sx={{
									fontWeight: 700,
									bgcolor: 'rgba(37,99,235,0.08)',
									color: 'primary.main',
								}}
							/>
						))}
						{teacher.expertise.length > 4 && (
							<Chip label={`+${teacher.expertise.length - 4}`} size='small' />
						)}
					</Box>
				)}

				{teacher.bio && (
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{
							mt: 2,
							lineHeight: 1.7,
							display: '-webkit-box',
							WebkitLineClamp: 4,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{teacher.bio}
					</Typography>
				)}

				<Box sx={{ flexGrow: 1 }} />

				{hasSocials && (
					<Stack direction='row' spacing={1} sx={{ mt: 2.5, justifyContent: 'center' }}>
						{teacher.socialLinks?.twitter && (
							<Tooltip title='Twitter'>
								<IconButton component='a' href={teacher.socialLinks.twitter} target='_blank' size='small' sx={{ color: '#1DA1F2', bgcolor: 'rgba(29,161,242,0.1)' }}>
									<TwitterIcon fontSize='small' />
								</IconButton>
							</Tooltip>
						)}
						{teacher.socialLinks?.linkedin && (
							<Tooltip title='LinkedIn'>
								<IconButton component='a' href={teacher.socialLinks.linkedin} target='_blank' size='small' sx={{ color: '#0A66C2', bgcolor: 'rgba(10,102,194,0.1)' }}>
									<LinkedInIcon fontSize='small' />
								</IconButton>
							</Tooltip>
						)}
						{teacher.socialLinks?.website && (
							<Tooltip title='Website'>
								<IconButton component='a' href={teacher.socialLinks.website} target='_blank' size='small' sx={{ color: '#10b981', bgcolor: 'rgba(16,185,129,0.1)' }}>
									<LanguageIcon fontSize='small' />
								</IconButton>
							</Tooltip>
						)}
					</Stack>
				)}
			</Box>
		</Card>
	);
}

export default function PublicTeachersPage() {
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		teacherService
			.getAll()
			.then((res) => setTeachers(res.data ?? []))
			.catch(() => setTeachers([]))
			.finally(() => setLoading(false));
	}, []);

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			<Container maxWidth='xl' sx={{ py: { xs: 5, md: 7 } }}>
				<Box sx={{ mb: 4, maxWidth: 680 }}>
					<Typography variant='h3' sx={{ fontWeight: 900, fontSize: { xs: '2.1rem', md: '3rem' } }}>
						Our Instructors
					</Typography>
					<Typography variant='body1' color='text.secondary' sx={{ mt: 1, lineHeight: 1.7 }}>
						Learn from experienced teachers who bring practical insight, structured lessons, and real subject expertise.
					</Typography>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
						<CircularProgress />
					</Box>
				) : teachers.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 10 }}>
						<SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
						<Typography color='text.secondary'>No teachers found.</Typography>
					</Box>
				) : (
					<Grid container spacing={3}>
						{teachers.map((teacher) => (
							<Grid key={teacher._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
								<TeacherProfileCard teacher={teacher} />
							</Grid>
						))}
					</Grid>
				)}
			</Container>
		</Box>
	);
}
