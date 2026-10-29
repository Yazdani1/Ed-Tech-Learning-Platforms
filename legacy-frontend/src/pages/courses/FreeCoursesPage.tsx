import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Button,
	Chip,
	Container,
	Divider,
	Grid,
	Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import { courseService } from '../../services/course.service';
import { courseTypeService } from '../../services/courseType.service';
import CourseCard, { CourseCardSkeleton } from '../../components/ui/CourseCard';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { useAuth } from '../../context/useAuth';
import { encodeParam } from '../../utils/urlParams';
import type { ICourse, ICourseType } from '../../types/index';

const FREE_COURSES_PER_TYPE = 6;
const FREE_COURSE_SKELETONS = Array.from({ length: 8 });

const FreeCoursesPage= () => {
	const { user, isLoading: authLoading } = useAuth();
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;

		Promise.all([courseService.browse(), courseTypeService.getAll()])
			.then(([courseRes, typeRes]) => {
				if (!alive) return;
				setCourses(
					(courseRes.data ?? []).filter(
						(course): course is ICourse =>
							Boolean(course?._id) && course.pricing === 'Free',
					),
				);
				setCourseTypes(typeRes.data ?? []);
			})
			.catch(() => {
				if (!alive) return;
				setCourses([]);
				setCourseTypes([]);
			})
			.finally(() => {
				if (alive) setLoading(false);
			});

		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		if (authLoading) return;
		if (user?.role === 'Student') {
			courseService
				.getEnrolled()
				.then((res) =>
					setEnrolledCourseIds((res.data ?? []).map((course) => course._id)),
				)
				.catch(() => setEnrolledCourseIds([]));
		} else {
			setEnrolledCourseIds([]);
		}
	}, [authLoading, user]);

	const groupedCourses = useMemo(() => {
		const freeCoursesByType = new Map<string, ICourse[]>();
		const untypedCourses: ICourse[] = [];

		for (const course of courses) {
			const typeId = course.courseType?._id;
			if (!typeId) {
				untypedCourses.push(course);
				continue;
			}

			const list = freeCoursesByType.get(typeId) ?? [];
			list.push(course);
			freeCoursesByType.set(typeId, list);
		}

		const groups = courseTypes
			.map((courseType) => ({
				id: courseType._id,
				name: courseType.name,
				description: courseType.description,
				courses: freeCoursesByType.get(courseType._id) ?? [],
			}))
			.filter((group) => group.courses.length > 0);

		if (untypedCourses.length > 0) {
			groups.push({
				id: 'uncategorized',
				name: 'Other Free Courses',
				description: undefined,
				courses: untypedCourses,
			});
		}

		return groups;
	}, [courses, courseTypes]);

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			<Container maxWidth='lg' sx={{ py: { xs: 3, md: 5 }, pb: 8 }}>
				<Box
					sx={{
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: 1,
						px: { xs: 2, md: 3 },
						py: { xs: 3, md: 4 },
					}}
				>
				<Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
					<Typography variant='h4' sx={{ fontWeight: 800 }}>
						Free Courses
					</Typography>
					<Typography variant='body1' color='text.secondary' sx={{ mt: 0.75 }}>
						{loading
							? 'Loading free courses...'
							: `${courses.length} free course${courses.length !== 1 ? 's' : ''} available`}
					</Typography>
				</Box>

				{loading ? (
					<Grid container spacing={3}>
						{FREE_COURSE_SKELETONS.map((_, index) => (
							<Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
								<CourseCardSkeleton showAction={user?.role === 'Student'} />
							</Grid>
						))}
					</Grid>
				) : groupedCourses.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 10 }}>
						<SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
						<Typography variant='h6' color='text.secondary'>
							No free courses are available right now.
						</Typography>
					</Box>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						{groupedCourses.map((group, index) => (
							<Box
								key={group.id}
							>
								{index > 0 && <Divider sx={{ mb: 4 }} />}
								<Box sx={{ textAlign: 'center', mb: 3 }}>
									<Typography variant='h5' sx={{ fontWeight: 800 }}>
										{group.name}
									</Typography>
									{group.description && (
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{ mt: 0.75, maxWidth: 680, mx: 'auto' }}
										>
											{group.description}
										</Typography>
									)}
									<Chip
										label={`${group.courses.length} free course${group.courses.length !== 1 ? 's' : ''}`}
										size='small'
										color='success'
										sx={{ mt: 1.25, fontWeight: 700 }}
									/>
								</Box>

								<Grid container spacing={3}>
									{group.courses.slice(0, FREE_COURSES_PER_TYPE).map((course) => (
										<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4 }}>
											<CourseCard
												course={course}
												basePath='/courses'
												isEnrolled={enrolledCourseIds.includes(course._id)}
												learningPath={`/student/courses/${course._id}/learn`}
											/>
										</Grid>
									))}
								</Grid>

								{group.courses.length > FREE_COURSES_PER_TYPE && group.id !== 'uncategorized' && (
									<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
										<Button
											component={RouterLink}
											to={`/courses?courseTypes=${encodeParam(group.id)}&pricing=${encodeParam('Free')}`}
											variant='outlined'
											endIcon={<ArrowForwardIcon />}
											sx={{ fontWeight: 800, textTransform: 'none' }}
										>
											See all {group.name} courses
										</Button>
									</Box>
								)}
							</Box>
						))}
					</Box>
				)}
				</Box>
			</Container>
		</Box>
	);
};

export default FreeCoursesPage;
