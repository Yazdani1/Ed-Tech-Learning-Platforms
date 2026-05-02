import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	Chip,
	CircularProgress,
	Grid,
	Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { teacherService } from '../../services/teacher.service';
import type { ICourse } from '../../types/index';

export default function TeacherCoursesPage() {
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
						<Grid item xs={12} sm={6} md={4} key={course._id}>
							<Card
								elevation={0}
								sx={{ border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}
							>
								<CardActionArea
									onClick={() => navigate(`/teacher/courses/${course._id}/learn`)}
									sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
								>
									{course.coverImage ? (
										<CardMedia
											component='img'
											height='160'
											image={course.coverImage}
											alt={course.title}
										/>
									) : (
										<Box
											sx={{
												height: 160,
												bgcolor: 'primary.light',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<SchoolIcon sx={{ fontSize: 48, color: 'primary.main' }} />
										</Box>
									)}
									<CardContent sx={{ flex: 1 }}>
										<Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
											{course.title}
										</Typography>
										{course.subtitle && (
											<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }} noWrap>
												{course.subtitle}
											</Typography>
										)}
										<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
											<Chip
												label={course.status}
												size='small'
												color={course.status === 'Published' ? 'success' : 'default'}
												variant='outlined'
											/>
											<Chip label={course.pricing} size='small' variant='outlined' />
											{course.category && (
												<Chip label={course.category.name} size='small' variant='outlined' />
											)}
										</Box>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					))}
				</Grid>
			)}
		</Box>
	);
}
