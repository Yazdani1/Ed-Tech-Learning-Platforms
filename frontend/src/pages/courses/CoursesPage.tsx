import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	Grid,
	Typography,
	TextField,
	InputAdornment,
	CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { courseService } from '../../services/course.service';
import CourseCard from '../../components/ui/CourseCard';
import type { ICourse } from '../../types/index';
import { useAuth } from '../../context/useAuth';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;

export default function CoursesPage() {
	const { user, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const abortRef = useRef<AbortController | null>(null);

	const isAdmin = user && (ADMIN_ROLES as readonly string[]).includes(user.role);
	const isStudent = user?.role === 'Student';

	useEffect(() => {
		// Wait until auth finishes so we know exactly who the user is
		if (authLoading) return;

		// Cancel any in-flight request from a previous render
		abortRef.current?.abort();
		abortRef.current = new AbortController();

		setLoading(true);
		const load = isStudent
			? courseService.getEnrolled()
			: courseService.getAll(search ? { search } : {});

		load
			.then((res) => setCourses(res.data ?? []))
			.catch(() => { /* errors handled by interceptor */ })
			.finally(() => setLoading(false));

		return () => { abortRef.current?.abort(); };
	}, [search, isStudent, authLoading]);

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					{isStudent ? 'My Courses' : 'Courses'}
				</Typography>
				{isAdmin && (
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={() => navigate('/admin/courses/create')}
					>
						Create Course
					</Button>
				)}
			</Box>

			<TextField
				placeholder='Search courses...'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				size='small'
				sx={{ mb: 3, maxWidth: 360 }}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position='start'>
								<SearchIcon />
							</InputAdornment>
						),
					},
				}}
			/>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
					<CircularProgress />
				</Box>
			) : courses.length === 0 ? (
				<Typography
					sx={{ color: 'text.secondary', textAlign: 'center', mt: 8 }}
				>
					{isStudent ? "You haven't enrolled in any courses yet." : 'No courses found.'}
				</Typography>
			) : (
				<Grid container spacing={3}>
					{courses.map((course) => (
						<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
							<CourseCard
								course={course}
								basePath={isAdmin ? '/admin/courses' : '/courses'}
							/>
						</Grid>
					))}
				</Grid>
			)}
		</Box>
	);
}
