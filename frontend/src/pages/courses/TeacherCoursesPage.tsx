import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	Paper,
	Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { teacherService } from '../../services/teacher.service';
import type { ICourse } from '../../types/index';

const TeacherCoursesPage= () => {
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [noProfile, setNoProfile] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		teacherService
			.getMyCourses()
			.then((res) => {
				setCourses(res.data ?? []);
				if ((res.data ?? []).length === 0) setNoProfile(true);
			})
			.catch(() => setNoProfile(true))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
				My Courses
			</Typography>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
				Courses you are assigned to teach.
			</Typography>

			{courses.length === 0 ? (
				<Box sx={{ textAlign: 'center', mt: 10 }}>
					<SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
					<Typography variant='h6' color='text.secondary'>
						{noProfile
							? 'Your teacher profile is not linked to a user account yet. Ask an admin to link your profile.'
							: 'No courses assigned to you yet.'}
					</Typography>
				</Box>
			) : (
				<Grid container spacing={3}>
					{courses.map((course) => (
						<Grid size={{ xs: 12, lg: 6 }} key={course._id}>
							<TeacherCourseCard
								course={course}
								onView={() => navigate(`/teacher/courses/${course._id}/learn`)}
							/>
						</Grid>
					))}
				</Grid>
			)}
		</Box>
	);
};

export default TeacherCoursesPage;

interface TeacherCourseCardProps {
	course: ICourse;
	onView: () => void;
}

const TeacherCourseCard: FC<TeacherCourseCardProps> = ({ course, onView }) => {
	const teachers = course.teachers?.map((teacher) => teacher.name).join(', ');

	return (
		<Paper
			variant='outlined'
			sx={{
				height: '100%',
				borderRadius: 1,
				overflow: 'hidden',
				display: 'flex',
				bgcolor: 'background.paper',
				transition: 'transform 0.22s ease, box-shadow 0.22s ease',
				'&:hover': {
					transform: 'translateY(-3px)',
					boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
				},
			}}
		>
			<Box
				sx={{
					width: 188,
					flexShrink: 0,
					bgcolor: 'grey.100',
					position: 'relative',
					display: { xs: 'none', sm: 'block' },
				}}
			>
				{course.coverImage ? (
					<Box
						component='img'
						src={course.coverImage}
						alt={course.title}
						sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
					/>
				) : (
					<Box
						sx={{
							height: '100%',
							minHeight: 210,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background:
								'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(21,101,192,0.12))',
						}}
					>
						<SchoolOutlinedIcon sx={{ color: 'primary.main', fontSize: 46 }} />
					</Box>
				)}
				{course.courseType && (
					<Box
						sx={{
							position: 'absolute',
							top: 12,
							left: 12,
							px: 1.25,
							py: 0.6,
							borderRadius: 1,
							background:
								'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)',
							backgroundSize: '250% auto',
							color: 'white',
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

			<Box sx={{ p: 2.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
					<Box sx={{ minWidth: 0 }}>
						<Typography
							variant='h6'
							sx={{
								fontWeight: 900,
								lineHeight: 1.25,
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{course.title}
						</Typography>
						{course.subtitle && (
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{
									mt: 0.75,
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{course.subtitle}
							</Typography>
						)}
					</Box>
					<Chip
						label={course.status}
						size='small'
						color={course.status === 'Published' ? 'success' : 'default'}
						variant='outlined'
						sx={{ fontWeight: 800, flexShrink: 0 }}
					/>
				</Box>

				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
					{course.courseType?.name && (
						<Chip label={course.courseType.name} size='small' variant='outlined' sx={{ fontWeight: 700 }} />
					)}
					{course.category?.name && (
						<Chip label={course.category.name} size='small' variant='outlined' sx={{ fontWeight: 700 }} />
					)}
					<Chip label={course.visibility} size='small' sx={{ fontWeight: 700 }} />
				</Box>

				{course.description && (
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{
							mt: 2,
							lineHeight: 1.7,
							display: '-webkit-box',
							WebkitLineClamp: 3,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{course.description}
					</Typography>
				)}

				<Box sx={{ flexGrow: 1 }} />
				<Divider sx={{ my: 2 }} />

				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
							Assigned teachers
						</Typography>
						<Typography
							variant='body2'
							sx={{
								fontWeight: 700,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{teachers || 'No teachers assigned'}
						</Typography>
					</Box>
					<Button
						variant='contained'
						size='small'
						startIcon={<VisibilityOutlinedIcon />}
						onClick={onView}
						sx={{ fontWeight: 800, flexShrink: 0 }}
					>
						View
					</Button>
				</Box>
			</Box>
		</Paper>
	);
}
