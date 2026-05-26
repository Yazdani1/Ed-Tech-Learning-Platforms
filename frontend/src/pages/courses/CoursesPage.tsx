import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControl,
	Grid,
	InputAdornment,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import { teacherService } from '../../services/teacher.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { CourseCardSkeleton } from '../../components/ui/CourseCard';
import BulkEditModal from '../../components/course/BulkEditModal';
import CourseCardWithRemove from './courseList/CourseCardWithRemove';
import ModeratorCourseCard from './courseList/ModeratorCourseCard';
import AdminCourseCard from './courseList/AdminCourseCard';
import type { ICategory, ICourse, ICourseType, ITeacher, CoursePricing, CourseStatus, CourseVisibility, SubscriptionPlan } from '../../types/index';
import { useAuth } from '../../context/useAuth';
import { useConfirmModal } from '../../context/ConfirmModalContext';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;
const COURSE_CARD_SKELETONS = Array.from({ length: 8 });
type ActivityFilter = '' | 'has_lifetime' | 'none_lifetime' | 'has_this_month' | 'none_this_month' | 'has_previous_month' | 'none_previous_month';

const ENROLLMENT_ACTIVITY_FILTERS: { label: string; value: ActivityFilter }[] = [
	{ label: 'All enrollments', value: '' },
	{ label: 'Has students ever', value: 'has_lifetime' },
	{ label: 'No students ever', value: 'none_lifetime' },
	{ label: 'Enrolled this month', value: 'has_this_month' },
	{ label: 'No enrollments this month', value: 'none_this_month' },
	{ label: 'Enrolled previous month', value: 'has_previous_month' },
	{ label: 'No enrollments previous month', value: 'none_previous_month' },
];

const EARNING_ACTIVITY_FILTERS: { label: string; value: ActivityFilter }[] = [
	{ label: 'All earnings', value: '' },
	{ label: 'Earned ever', value: 'has_lifetime' },
	{ label: 'No earnings ever', value: 'none_lifetime' },
	{ label: 'Earned this month', value: 'has_this_month' },
	{ label: 'No earnings this month', value: 'none_this_month' },
	{ label: 'Earned previous month', value: 'has_previous_month' },
	{ label: 'No earnings previous month', value: 'none_previous_month' },
];

const CoursesPage= () => {
	const { user, isLoading: authLoading } = useAuth();
	const { confirm } = useConfirmModal();
	const navigate = useNavigate();
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [bulkOpen, setBulkOpen] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
	const [moderatorFilters, setModeratorFilters] = useState<{
		courseType: string;
		category: string;
		teacher: string;
		status: '' | CourseStatus;
		pricing: '' | CoursePricing;
		visibility: '' | CourseVisibility;
		subscriptionPlan: '' | SubscriptionPlan;
		enrollmentActivity: ActivityFilter;
		earningActivity: ActivityFilter;
	}>({
		courseType: '',
		category: '',
		teacher: '',
		status: '',
		pricing: '',
		visibility: '',
		subscriptionPlan: '',
		enrollmentActivity: '',
		earningActivity: '',
	});
	const abortRef = useRef<AbortController | null>(null);

	const isAdmin = user && (ADMIN_ROLES as readonly string[]).includes(user.role);
	const isStudent = user?.role === 'Student';
	const isModerator = user?.role === 'Moderator';

	useEffect(() => {
		if (!isAdmin || isStudent) return;
		Promise.all([categoryService.getAll(), courseTypeService.getAll(), teacherService.getAll(), subscriptionPlanConfigService.getAll()])
			.then(([catRes, typeRes, teacherRes, planRes]) => {
				setCategories(catRes.data ?? []);
				setCourseTypes(typeRes.data ?? []);
				setTeachers(teacherRes.data ?? []);
				setSubscriptionPlans((planRes.data ?? []).map((plan) => plan.plan));
			})
			.catch(() => {
				setCategories([]);
				setCourseTypes([]);
				setTeachers([]);
				setSubscriptionPlans([]);
			});
	}, [isAdmin, isStudent]);

	useEffect(() => {
		if (authLoading) return;
		abortRef.current?.abort();
		abortRef.current = new AbortController();
		setLoading(true);

		const params: Record<string, string> = {};
		if (search) params.search = search;
		if (isModerator) {
			params.status = 'Published';
		} else if (moderatorFilters.status) {
			params.status = moderatorFilters.status;
		}
		if (isAdmin && !isStudent) {
			if (moderatorFilters.courseType) params.courseType = moderatorFilters.courseType;
			if (moderatorFilters.category) params.category = moderatorFilters.category;
			if (moderatorFilters.teacher) params.teacher = moderatorFilters.teacher;
			if (moderatorFilters.pricing) params.pricing = moderatorFilters.pricing;
			if (moderatorFilters.visibility) params.visibility = moderatorFilters.visibility;
			if (moderatorFilters.subscriptionPlan) params.subscriptionPlans = moderatorFilters.subscriptionPlan;
			if (moderatorFilters.enrollmentActivity) params.enrollmentFilter = moderatorFilters.enrollmentActivity;
			if (moderatorFilters.earningActivity) params.earningFilter = moderatorFilters.earningActivity;
		}

		const load = isStudent
			? courseService.getEnrolled()
			: courseService.getAll(params);

		load
			.then((res) => {
				const data = res.data;
				const valid = Array.isArray(data)
					? data.filter((c): c is ICourse => Boolean(c && (c as ICourse)._id))
					: [];
				setCourses(valid);
			})
			.catch(() => {})
			.finally(() => setLoading(false));

		return () => { abortRef.current?.abort(); };
	}, [search, isStudent, isModerator, authLoading, moderatorFilters]);

	const handleConfirmRemove = async (course: ICourse) => {
		const confirmed = await confirm({
			title: 'Remove Course',
			message: (
				<>
					Are you sure you want to remove <strong>&quot;{course.title}&quot;</strong> from your courses?
				</>
			),
			confirmText: 'Remove',
			cancelText: 'Keep It',
		});
		if (!confirmed) return;
		try {
			await courseService.unenroll(course._id);
			setCourses((prev) => prev.filter((c) => c._id !== course._id));
			toast.success(`Removed from "${course.title}"`);
		} catch {
			toast.error('Failed to remove course');
		}
	};

	// Student: filter client-side by search, split by enrollmentType
	const filtered = isStudent && search
		? courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
		: courses;

	const directCourses = filtered.filter((c) => c.enrollmentType !== 'subscription');
	const subCourses = filtered.filter((c) => c.enrollmentType === 'subscription');
	const moderatorFilterCount = Object.values(moderatorFilters).filter(Boolean).length;
	const hasModeratorFilters = moderatorFilterCount > 0 || Boolean(search);
	const activeFilterCount = moderatorFilterCount + (search ? 1 : 0);
	const showFilters = filtersOpen;
	const clearModeratorFilters = () => {
		setSearch('');
		setModeratorFilters({
			courseType: '',
			category: '',
			teacher: '',
			status: '',
			pricing: '',
			visibility: '',
			subscriptionPlan: '',
			enrollmentActivity: '',
			earningActivity: '',
		});
		setFiltersOpen(false);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					{isStudent ? 'My Courses' : 'Courses'}
				</Typography>
				{isAdmin && !isModerator && (
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button
							variant='outlined'
							startIcon={<TuneIcon />}
							onClick={() => setBulkOpen(true)}
							disabled={courses.length === 0}
						>
							Bulk Edit
						</Button>
						<Button
							variant='contained'
							startIcon={<AddIcon />}
							onClick={() => navigate('/admin/courses/create')}
						>
							Create Course
						</Button>
					</Box>
				)}
			</Box>

			{isAdmin && !isStudent ? (
				<Paper
					variant='outlined'
					sx={{
						p: 2,
						borderRadius: 1,
						mb: 3,
						bgcolor: 'background.paper',
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
						<Box>
							<Typography variant='subtitle1' sx={{ fontWeight: 900 }}>
								Filter courses
							</Typography>
							<Typography variant='body2' color='text.secondary'>
								{loading
									? 'Loading courses...'
									: isModerator
										? `${courses.length} published course${courses.length !== 1 ? 's' : ''}${hasModeratorFilters ? ' match your filters' : ' available'}`
										: `${courses.length} course${courses.length !== 1 ? 's' : ''}${hasModeratorFilters ? ' match your filters' : ' available'}`}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
							<Chip
								label={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
								size='small'
								color={hasModeratorFilters ? 'primary' : 'default'}
								sx={{ fontWeight: 800 }}
							/>
							{activeFilterCount > 0 && (
								<Chip
									label={`${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
									size='small'
									color='primary'
									variant='outlined'
									sx={{ fontWeight: 800 }}
								/>
							)}
							{hasModeratorFilters && (
								<Button size='small' onClick={clearModeratorFilters}>
									Clear filters
								</Button>
							)}
							<Button
								size='small'
								variant='outlined'
								startIcon={<TuneIcon />}
								endIcon={
									<ExpandMoreIcon
										sx={{
											transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
											transition: 'transform 0.2s ease',
										}}
									/>
								}
								onClick={() => setFiltersOpen((prev) => !prev)}
							>
								{showFilters ? 'Hide filters' : 'Show filters'}
							</Button>
						</Box>
					</Box>

					<Box
						sx={{
							display: showFilters ? 'block' : 'none',
							pt: 2,
							borderTop: '1px solid',
							borderColor: 'divider',
						}}
					>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<TextField
								placeholder='Search courses...'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								size='small'
								fullWidth
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position='start'>
												<SearchIcon fontSize='small' />
											</InputAdornment>
										),
									},
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Course Type</InputLabel>
								<Select
									label='Course Type'
									value={moderatorFilters.courseType}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											courseType: e.target.value,
										}))
									}
								>
									<MenuItem value=''>All course types</MenuItem>
									{courseTypes.map((courseType) => (
										<MenuItem key={courseType._id} value={courseType._id}>
											{courseType.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Category</InputLabel>
								<Select
									label='Category'
									value={moderatorFilters.category}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											category: e.target.value,
										}))
									}
								>
									<MenuItem value=''>All categories</MenuItem>
									{categories.map((category) => (
										<MenuItem key={category._id} value={category._id}>
											{category.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Teacher</InputLabel>
								<Select
									label='Teacher'
									value={moderatorFilters.teacher}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											teacher: e.target.value,
										}))
									}
								>
									<MenuItem value=''>All teachers</MenuItem>
									{teachers.map((teacher) => (
										<MenuItem key={teacher._id} value={teacher._id}>
											{teacher.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						{!isModerator && (
							<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
								<FormControl size='small' fullWidth>
									<InputLabel>Status</InputLabel>
									<Select
										label='Status'
										value={moderatorFilters.status}
										onChange={(e) =>
											setModeratorFilters((prev) => ({
												...prev,
												status: e.target.value as '' | CourseStatus,
											}))
										}
									>
										<MenuItem value=''>All statuses</MenuItem>
										<MenuItem value='Published'>Published</MenuItem>
										<MenuItem value='Draft'>Draft</MenuItem>
									</Select>
								</FormControl>
							</Grid>
						)}
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Pricing</InputLabel>
								<Select
									label='Pricing'
									value={moderatorFilters.pricing}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											pricing: e.target.value as '' | CoursePricing,
										}))
									}
								>
									<MenuItem value=''>All pricing</MenuItem>
									<MenuItem value='Free'>Free</MenuItem>
									<MenuItem value='Paid'>Paid</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Visibility</InputLabel>
								<Select
									label='Visibility'
									value={moderatorFilters.visibility}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											visibility: e.target.value as '' | CourseVisibility,
										}))
									}
								>
									<MenuItem value=''>All visibility</MenuItem>
									<MenuItem value='Public'>Public</MenuItem>
									<MenuItem value='Private'>Private</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Subscription Plan</InputLabel>
								<Select
									label='Subscription Plan'
									value={moderatorFilters.subscriptionPlan}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											subscriptionPlan: e.target.value as '' | SubscriptionPlan,
										}))
									}
								>
									<MenuItem value=''>All plans</MenuItem>
									{subscriptionPlans.map((plan) => (
										<MenuItem key={plan} value={plan}>
											{plan}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Enrollment Activity</InputLabel>
								<Select
									label='Enrollment Activity'
									value={moderatorFilters.enrollmentActivity}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											enrollmentActivity: e.target.value as ActivityFilter,
										}))
									}
								>
									{ENROLLMENT_ACTIVITY_FILTERS.map((option) => (
										<MenuItem key={option.value || 'all'} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Earning Activity</InputLabel>
								<Select
									label='Earning Activity'
									value={moderatorFilters.earningActivity}
									onChange={(e) =>
										setModeratorFilters((prev) => ({
											...prev,
											earningActivity: e.target.value as ActivityFilter,
										}))
									}
								>
									{EARNING_ACTIVITY_FILTERS.map((option) => (
										<MenuItem key={option.value || 'all'} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
					</Grid>
					</Box>
				</Paper>
			) : (
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
			)}

			{loading ? (
				isStudent ? (
					<Grid container spacing={3}>
						{COURSE_CARD_SKELETONS.map((_, index) => (
							<Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
								<CourseCardSkeleton />
							</Grid>
						))}
					</Grid>
				) : (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
						<CircularProgress />
					</Box>
				)
			) : isStudent ? (
				/* â”€â”€ Student: two labelled sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
				<>
					{/* Section 1: Free & Paid courses */}
					<Box sx={{ mb: 5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
							<Typography variant='h6' sx={{ fontWeight: 700 }}>
								Free &amp; Paid Courses
							</Typography>
							<Chip label={directCourses.length} size='small' color='primary' />
						</Box>

						{directCourses.length === 0 ? (
							<Typography variant='body2' color='text.secondary'>
								No free or paid courses enrolled yet.
							</Typography>
						) : (
							<Grid container spacing={3}>
								{directCourses.map((course) => (
									<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<CourseCardWithRemove
											course={course}
											onRemove={() => void handleConfirmRemove(course)}
										/>
									</Grid>
								))}
							</Grid>
						)}
					</Box>

					{/* Section 2: Subscription courses */}
					<Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
							<CardMembershipIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
							<Typography variant='h6' sx={{ fontWeight: 700 }}>
								Enrolled with Subscription
							</Typography>
							<Chip label={subCourses.length} size='small' sx={{ bgcolor: '#7c3aed', color: 'white' }} />
						</Box>

						{subCourses.length === 0 ? (
							<Typography variant='body2' color='text.secondary'>
								No subscription courses enrolled yet.
							</Typography>
						) : (
							<Grid container spacing={3}>
								{subCourses.map((course) => (
									<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<CourseCardWithRemove
											course={course}
											onRemove={() => void handleConfirmRemove(course)}
											subscriptionBadge
										/>
									</Grid>
								))}
							</Grid>
						)}
					</Box>

					{filtered.length === 0 && search && (
						<Typography color='text.secondary' sx={{ mt: 4, textAlign: 'center' }}>
							No courses match &quot;{search}&quot;.
						</Typography>
					)}
					{courses.length === 0 && !search && (
						<Typography color='text.secondary' sx={{ mt: 4, textAlign: 'center' }}>
							You haven&apos;t enrolled in any courses yet.
						</Typography>
					)}
				</>
			) : isModerator ? (
				courses.length === 0 ? (
					<Typography color='text.secondary' sx={{ textAlign: 'center', mt: 8 }}>
						No published courses found.
					</Typography>
				) : (
					<Grid container spacing={3}>
						{courses.map((course) => (
							<Grid key={course._id} size={{ xs: 12, md: 6 }}>
								<ModeratorCourseCard
									course={course}
									onStudentView={() => navigate(`/admin/courses/${course._id}/learn`)}
								/>
							</Grid>
						))}
					</Grid>
				)
			) : (
				/* â”€â”€ Admin: list rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
				courses.length === 0 ? (
					<Typography color='text.secondary' sx={{ textAlign: 'center', mt: 8 }}>
						No courses found.
					</Typography>
				) : (
					<Grid container spacing={3}>
						{courses.map((course) => (
							<Grid key={course._id} size={{ xs: 12, md: 6 }}>
								<AdminCourseCard
									course={course}
									onEdit={() => navigate(`/admin/courses/${course._id}/edit`)}
									onStudentView={() => navigate(`/admin/courses/${course._id}/learn`)}
								/>
							</Grid>
						))}
					</Grid>
				)
			)}

			{/* Bulk edit modal (admin only) */}
			{isAdmin && !isModerator && (
				<BulkEditModal
					open={bulkOpen}
					courses={courses}
					onClose={() => setBulkOpen(false)}
					onSuccess={() => {
						// Re-fetch courses after bulk update
						const params: Record<string, string> = {};
						if (search) params.search = search;
						if (moderatorFilters.status) params.status = moderatorFilters.status;
						if (moderatorFilters.courseType) params.courseType = moderatorFilters.courseType;
						if (moderatorFilters.category) params.category = moderatorFilters.category;
						if (moderatorFilters.teacher) params.teacher = moderatorFilters.teacher;
						if (moderatorFilters.pricing) params.pricing = moderatorFilters.pricing;
						if (moderatorFilters.visibility) params.visibility = moderatorFilters.visibility;
						if (moderatorFilters.subscriptionPlan) params.subscriptionPlans = moderatorFilters.subscriptionPlan;
						if (moderatorFilters.enrollmentActivity) params.enrollmentFilter = moderatorFilters.enrollmentActivity;
						if (moderatorFilters.earningActivity) params.earningFilter = moderatorFilters.earningActivity;
						const load = courseService.getAll(params);
						load.then((res) => {
							const data = res.data;
							const valid = Array.isArray(data)
								? data.filter((c): c is ICourse => Boolean(c && (c as ICourse)._id))
								: [];
							setCourses(valid);
						}).catch(() => {});
					}}
				/>
			)}
		</Box>
	);
};

export default CoursesPage;
