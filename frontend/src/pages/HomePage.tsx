import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
	Box,
	Button,
	CardActionArea,
	Chip,
	Container,
	Divider,
	Grid,
	Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { courseService } from '../services/course.service';
import { categoryService } from '../services/category.service';
import { courseTypeService } from '../services/courseType.service';
import { teacherService } from '../services/teacher.service';
import CourseCard, { CourseCardSkeleton } from '../components/ui/CourseCard';
import PublicNavbar from '../components/layout/PublicNavbar';
import CourseFilterSidebar from '../components/course/CourseFilterSidebar';
import AppPagination from '../components/common/AppPagination';
import RenderWhenNearViewport from '../components/common/RenderWhenNearViewport';
import { useAuth } from '../context/useAuth';
import { encodeParam, decodeParam } from '../utils/urlParams';
import type {
	ICourse,
	ICategory,
	ICourseType,
	ITeacher,
	IPaginationMeta,
	SubscriptionPlan,
} from '../types/index';

const STATS = [
	{
		icon: <MenuBookIcon sx={{ color: 'primary.main' }} />,
		value: '100+',
		label: 'Courses',
	},
	{
		icon: <PeopleIcon sx={{ color: 'primary.main' }} />,
		value: '50+',
		label: 'Expert Teachers',
	},
	{
		icon: <PlayCircleIcon sx={{ color: 'primary.main' }} />,
		value: '1,000+',
		label: 'Students Enrolled',
	},
	{
		icon: <SchoolIcon sx={{ color: 'primary.main' }} />,
		value: '95%',
		label: 'Satisfaction Rate',
	},
];

const CATEGORY_GRADIENTS = [
	'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
	'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
	'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)',
	'linear-gradient(135deg, #86198f 0%, #ec4899 100%)',
	'linear-gradient(135deg, #166534 0%, #84cc16 100%)',
	'linear-gradient(135deg, #4338ca 0%, #a78bfa 100%)',
];

const HOME_COURSES_PAGE_SIZE = 8;
const HOME_COURSE_SKELETONS = Array.from({ length: HOME_COURSES_PAGE_SIZE });
const ThreeLearningScene = lazy(() => import('../components/home/ThreeLearningScene'));
const TeacherMarqueeSection = lazy(
	() => import('../components/teacher/TeacherMarqueeSection'),
);

const CLASS_OPTIONS = [
	{
		title: 'One-to-one mentoring',
		description: 'Private sessions for focused goals, weak points, and personal pace.',
	},
	{
		title: 'Small group classes',
		description: 'Collaborative classes with peer energy and teacher attention.',
	},
	{
		title: 'Batch-based live programs',
		description: 'Scheduled cohorts for exam prep, skills, and structured programs.',
	},
	{
		title: 'Teacher-led assignments',
		description: 'Practice tasks, feedback, and guided improvement after lessons.',
	},
	{
		title: 'Class recordings',
		description: 'Rewatch important sessions when revising or catching up.',
	},
	{
		title: 'Discussion support',
		description: 'Ask questions and continue learning between live classes.',
	},
];

const PLATFORM_TOOLS = [
	{
		title: 'MCQ Quiz Engine',
		description:
			'Practice topic-wise quizzes, timed tests, answer review, and performance tracking.',
	},
	{
		title: 'Portfolio Website Builder',
		description:
			'Students can create a personal portfolio to showcase projects, products, skills, and certificates.',
	},
	{
		title: 'Discussion Forum',
		description:
			'Ask questions, answer classmates, follow course discussions, and learn as a community.',
	},
	{
		title: 'Learning Materials',
		description:
			'Access study files, announcements, preview videos, and teacher-provided resources in one place.',
	},
];

export default function HomePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const paramsKey = searchParams.toString();

	// ── All filter values derived from URL (decoded) ────────────
	const urlSearch = decodeParam(searchParams.get('q') ?? '');
	const urlCourseTypes = decodeParam(searchParams.get('courseTypes') ?? '')
		.split(',')
		.filter(Boolean);
	const urlCategories = decodeParam(searchParams.get('categories') ?? '')
		.split(',')
		.filter(Boolean);
	const urlPlans = decodeParam(searchParams.get('subscriptionPlans') ?? '')
		.split(',')
		.filter(Boolean) as SubscriptionPlan[];
	const urlPage = Math.max(
		Number(decodeParam(searchParams.get('page') ?? '')) || 1,
		1,
	);

	// ── Local state for search input only (smooth typing) ────────
	const [searchInput, setSearchInput] = useState(urlSearch);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isDebouncing = useRef(false);

	// ── Reference data ───────────────────────────────────────────
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const { user, isLoading: authLoading } = useAuth();
	const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

	// ── Fetch state: derived loading ─────────────────────────────
	const [fetchState, setFetchState] = useState<{
		key: string;
		courses: ICourse[];
		pagination: IPaginationMeta | null;
	}>({
		key: '__init__',
		courses: [],
		pagination: null,
	});
	const loading = fetchState.key !== paramsKey;

	useEffect(() => {
		if (!isDebouncing.current) setSearchInput(urlSearch);
	}, [urlSearch]);

	useEffect(() => {
		Promise.all([
			categoryService.getAll(),
			courseTypeService.getAll(),
			teacherService.getAll(),
		]).then(([cats, cts, teacherRes]) => {
			setCategories(cats.data ?? []);
			setCourseTypes(cts.data ?? []);
			setTeachers(teacherRes.data ?? []);
		});
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

	useEffect(() => {
		const params: Record<string, string> = {};
		if (urlSearch) params.search = urlSearch;
		if (urlCourseTypes.length > 0)
			params.courseTypes = urlCourseTypes.join(',');
		if (urlCategories.length > 0) params.categories = urlCategories.join(',');
		if (urlPlans.length > 0) params.subscriptionPlans = urlPlans.join(',');
		params.page = String(urlPage);
		params.limit = String(HOME_COURSES_PAGE_SIZE);

		courseService
			.browse(params)
			.then((res) => {
				const data = res.data;
				setFetchState({
					key: paramsKey,
					courses: Array.isArray(data)
						? data.filter((c): c is ICourse => Boolean(c?._id))
						: [],
					pagination: res.pagination ?? null,
				});
			})
			.catch(() =>
				setFetchState({ key: paramsKey, courses: [], pagination: null }),
			);
	}, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

	// ── URL helpers ──────────────────────────────────────────────
	const updateParams = (patch: Record<string, string | null>) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				for (const [key, val] of Object.entries(patch)) {
					if (val) next.set(key, key === 'page' ? val : encodeParam(val));
					else next.delete(key);
				}
				return next;
			},
			{ replace: true },
		);
	};

	const handleSearchChange = (value: string) => {
		setSearchInput(value);
		isDebouncing.current = true;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			isDebouncing.current = false;
			updateParams({ q: value.trim() || null, page: null });
		}, 350);
	};

	const toggleCourseType = (id: string) => {
		const next = urlCourseTypes.includes(id)
			? urlCourseTypes.filter((x) => x !== id)
			: [...urlCourseTypes, id];
		updateParams({ courseTypes: next.join(',') || null, page: null });
	};

	const toggleCategory = (id: string) => {
		const next = urlCategories.includes(id)
			? urlCategories.filter((x) => x !== id)
			: [...urlCategories, id];
		updateParams({ categories: next.join(',') || null, page: null });
	};

	const togglePlan = (plan: SubscriptionPlan) => {
		const next = urlPlans.includes(plan)
			? urlPlans.filter((x) => x !== plan)
			: [...urlPlans, plan];
		updateParams({ subscriptionPlans: next.join(',') || null, page: null });
	};

	const clearAll = () => {
		setSearchInput('');
		setSearchParams({}, { replace: true });
	};

	const activeFilterCount =
		urlCourseTypes.length + urlCategories.length + urlPlans.length;
	const hasActiveFilter = urlSearch || activeFilterCount > 0;
	const pagination = fetchState.pagination;

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			{/* ── Hero ─────────────────────────────────────────────────── */}
			<Box
				sx={{
					position: 'relative',
					overflow: 'hidden',
					background:
						'linear-gradient(135deg, #0d1b4b 0%, #1565c0 55%, #0288d1 100%)',
					color: 'white',
					py: { xs: 8, md: 13 },
					px: 2,
				}}
			>
				<Box
					sx={{
						position: 'absolute',
						top: -100,
						right: -100,
						width: 400,
						height: 400,
						borderRadius: '50%',
						background: 'rgba(255,255,255,0.06)',
						pointerEvents: 'none',
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						bottom: -80,
						left: -80,
						width: 320,
						height: 320,
						borderRadius: '50%',
						background: 'rgba(255,255,255,0.05)',
						pointerEvents: 'none',
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						top: '30%',
						right: '15%',
						width: 180,
						height: 180,
						borderRadius: '50%',
						background: 'rgba(2,136,209,0.25)',
						pointerEvents: 'none',
					}}
				/>

				<Container maxWidth='lg' sx={{ position: 'relative' }}>
					<Box sx={{ maxWidth: 620 }}>
						<Typography
							variant='h2'
							sx={{
								fontWeight: 900,
								lineHeight: 1.15,
								mb: 2.5,
								fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
								letterSpacing: -1,
							}}
						>
							Learn Without
							<Box component='span' sx={{ color: '#7ec8f8' }}>
								{' '}
								Limits
							</Box>
						</Typography>

						<Typography
							variant='h6'
							sx={{
								fontWeight: 400,
								opacity: 0.88,
								mb: 4,
								lineHeight: 1.7,
								fontSize: { xs: '1rem', md: '1.15rem' },
							}}
						>
							Explore expert-taught courses in technology, design, business, and
							more. Advance your career at your own pace — anytime, anywhere.
						</Typography>

						<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
							<Button
								size='large'
								onClick={() =>
									document
										.getElementById('courses-section')
										?.scrollIntoView({ behavior: 'smooth' })
								}
								sx={{
									bgcolor: 'white',
									color: 'primary.dark',
									fontWeight: 700,
									px: 4,
									borderRadius: 2,
									'&:hover': { bgcolor: 'grey.100' },
								}}
							>
								Explore Courses
							</Button>
							<Button
								size='large'
								variant='outlined'
								component={RouterLink}
								to='/auth/register'
								sx={{
									borderColor: 'rgba(255,255,255,0.7)',
									color: 'white',
									fontWeight: 700,
									px: 4,
									borderRadius: 2,
									'&:hover': {
										borderColor: 'white',
										bgcolor: 'rgba(255,255,255,0.1)',
									},
								}}
							>
								Start Free Today
							</Button>
						</Box>
					</Box>
				</Container>
			</Box>

			{/* ── Stats bar ────────────────────────────────────────────── */}
			<Box
				sx={{
					bgcolor: 'grey.50',
					borderBottom: '1px solid',
					borderColor: 'divider',
				}}
			>
				<Container maxWidth='lg'>
					<Box
						sx={{
							display: 'flex',
							gap: { xs: 3, md: 6 },
							py: 3,
							flexWrap: 'wrap',
							justifyContent: { xs: 'center', md: 'flex-start' },
						}}
					>
						{STATS.map(({ icon, value, label }) => (
							<Box
								key={label}
								sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
							>
								{icon}
								<Box>
									<Typography
										variant='subtitle1'
										sx={{ fontWeight: 800, lineHeight: 1.2 }}
									>
										{value}
									</Typography>
									<Typography variant='caption' color='text.secondary'>
										{label}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				</Container>
			</Box>

			{categories.length > 0 && (
				<Box sx={{ bgcolor: 'background.paper' }}>
					<Container maxWidth='xl' sx={{ pt: 7, pb: 6 }}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: { xs: 'flex-start', md: 'flex-end' },
								gap: 2,
								mb: 3,
								flexDirection: { xs: 'column', md: 'row' },
							}}
						>
							<Box>
								<Typography variant='h4' sx={{ fontWeight: 800 }}>
									Explore by Category
								</Typography>
								<Typography
									variant='body1'
									color='text.secondary'
									sx={{ mt: 0.5 }}
								>
									Pick a subject and jump straight into matching courses.
								</Typography>
							</Box>
							<Button
								component={RouterLink}
								to='/courses'
								endIcon={<ArrowForwardIcon />}
								sx={{ fontWeight: 700 }}
							>
								View all courses
							</Button>
						</Box>

						<Grid container spacing={2.5}>
							{categories.map((category, index) => {
								const gradient =
									CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
								const initial = category.name.trim().charAt(0).toUpperCase();

								return (
									<Grid key={category._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<CardActionArea
											component={RouterLink}
											to={`/courses?categories=${encodeParam(category._id)}`}
											sx={{
												position: 'relative',
												overflow: 'hidden',
												display: 'flex',
												alignItems: 'center',
												gap: 1.75,
												minHeight: 118,
												p: 2,
												borderRadius: 1,
												border: '1px solid',
												borderColor: 'divider',
												bgcolor: 'background.paper',
												textDecoration: 'none',
												boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
												transition:
													'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
												'&::before': {
													content: '""',
													position: 'absolute',
													inset: -1,
													background: `${gradient}, radial-gradient(circle at 18% 20%, rgba(255,255,255,0.46), transparent 34%), linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.58) 42%, transparent 58%)`,
													backgroundSize: '260% 260%, 180% 180%, 240% 100%',
													backgroundPosition: '0% 50%, -160% 0',
													opacity: 0.26,
													animation:
														'categoryGradientShift 4.8s ease-in-out infinite, categoryAmbientShine 3.8s ease-in-out infinite',
													transition: 'opacity 0.25s ease',
												},
												'&::after': {
													content: '""',
													position: 'absolute',
													top: 0,
													left: '-80%',
													width: '55%',
													height: '100%',
													background:
														'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
													transform: 'skewX(-18deg)',
													opacity: 0,
													transition: 'opacity 0.2s ease',
												},
												'&:hover': {
													transform: 'translateY(-4px)',
													boxShadow: '0 16px 38px rgba(15,23,42,0.13)',
													borderColor: 'primary.light',
												},
												'&:hover::before': { opacity: 0.34 },
												'&:hover::after': {
													opacity: 1,
													animation: 'categoryShine 0.85s ease',
												},
												'&:hover .category-icon': {
													transform: 'translateY(-2px) rotate(-3deg) scale(1.04)',
												},
												'&:hover .category-arrow': {
													opacity: 1,
													transform: 'translateX(0)',
												},
												'@keyframes categoryGradientShift': {
													'0%, 100%': {
														backgroundPosition: '0% 50%, 12% 18%, -160% 0',
													},
													'50%': {
														backgroundPosition: '100% 50%, 86% 72%, 80% 0',
													},
												},
												'@keyframes categoryAmbientShine': {
													'0%, 30%': {
														filter: 'saturate(1.08) brightness(1)',
													},
													'60%': {
														filter: 'saturate(1.35) brightness(1.08)',
													},
													'100%': {
														filter: 'saturate(1.08) brightness(1)',
													},
												},
												'@keyframes categoryShine': {
													'0%': { left: '-80%' },
													'100%': { left: '125%' },
												},
											}}
										>
											<Box
												className='category-icon'
												sx={{
													position: 'relative',
													width: 52,
													height: 52,
													borderRadius: 1,
													flexShrink: 0,
													display: 'grid',
													placeItems: 'center',
													color: 'white',
													background: gradient,
													backgroundSize: '260% 260%',
													boxShadow: '0 10px 22px rgba(15,23,42,0.18)',
													animation:
														'categoryIconGradient 4.5s ease-in-out infinite, categoryIconFloat 3.8s ease-in-out infinite',
													transition: 'transform 0.25s ease',
													'&::after': {
														content: '""',
														position: 'absolute',
														inset: 6,
														borderRadius: 0.75,
														border: '1px solid rgba(255,255,255,0.35)',
														opacity: 0.75,
													},
													'@keyframes categoryIconFloat': {
														'0%, 100%': { boxShadow: '0 10px 22px rgba(15,23,42,0.18)' },
														'50%': { boxShadow: '0 14px 28px rgba(15,23,42,0.24)' },
													},
													'@keyframes categoryIconGradient': {
														'0%, 100%': {
															backgroundPosition: '0% 50%',
															filter: 'saturate(1.1)',
														},
														'50%': {
															backgroundPosition: '100% 50%',
															filter: 'saturate(1.45) brightness(1.1)',
														},
													},
												}}
											>
												{initial ? (
													<Typography
														variant='h5'
														sx={{ fontWeight: 900, lineHeight: 1 }}
													>
														{initial}
													</Typography>
												) : (
													<CategoryIcon />
												)}
											</Box>

											<Box sx={{ position: 'relative', minWidth: 0, flex: 1 }}>
												<Typography
													variant='subtitle1'
													sx={{
														fontWeight: 800,
														color: 'text.primary',
														lineHeight: 1.25,
														overflowWrap: 'anywhere',
													}}
												>
													{category.name}
												</Typography>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ display: 'block', mt: 0.75, fontWeight: 600 }}
												>
													Browse category courses
												</Typography>
											</Box>

											<ArrowForwardIcon
												className='category-arrow'
												sx={{
													position: 'relative',
													color: 'text.secondary',
													opacity: 0.45,
													transform: 'translateX(-4px)',
													transition: 'opacity 0.25s ease, transform 0.25s ease',
												}}
											/>
										</CardActionArea>
									</Grid>
								);
							})}
						</Grid>
					</Container>
				</Box>
			)}

			<Divider sx={{ mx: { xs: 2, md: 'auto' }, maxWidth: 'lg', mt: 2 }} />

			{/* ── Courses + Filter ─────────────────────────────────────── */}
			<Box id='courses-section'>
				<Container maxWidth='xl' sx={{ pt: 6, pb: 10 }}>
					<Box sx={{ mb: 4 }}>
						<Typography variant='h4' sx={{ fontWeight: 800 }}>
							{hasActiveFilter ? 'Search Results' : 'Popular Courses'}
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ mt: 0.5 }}>
							{loading
								? 'Loading…'
								: hasActiveFilter
									? `${fetchState.courses.length} course${fetchState.courses.length !== 1 ? 's' : ''} found`
									: 'Hand-picked courses by our expert teachers'}
							{activeFilterCount > 0 && (
								<Chip
									label={`${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
									size='small'
									color='primary'
									sx={{ ml: 1, fontWeight: 700 }}
								/>
							)}
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
						{/* LEFT: filters */}
						<Box
							sx={{ width: 272, flexShrink: 0, position: 'sticky', top: 88 }}
						>
							<CourseFilterSidebar
								searchInput={searchInput}
								onSearchChange={handleSearchChange}
								courseTypes={courseTypes}
								selectedCourseTypes={urlCourseTypes}
								onToggleCourseType={toggleCourseType}
								categories={categories}
								selectedCategories={urlCategories}
								onToggleCategory={toggleCategory}
								selectedPlans={urlPlans}
								onTogglePlan={togglePlan}
								activeFilterCount={activeFilterCount}
								onClearAll={clearAll}
							/>
						</Box>

						{/* RIGHT: grid */}
						<Box sx={{ flex: 1, minWidth: 0 }}>
							{loading ? (
								<Grid container spacing={3}>
									{HOME_COURSE_SKELETONS.map((_, index) => (
										<Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
											<CourseCardSkeleton showAction={user?.role === 'Student'} />
										</Grid>
									))}
								</Grid>
							) : fetchState.courses.length === 0 ? (
								<Box sx={{ textAlign: 'center', py: 10 }}>
									<SchoolIcon
										sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
									/>
									<Typography variant='h6' color='text.secondary'>
										{hasActiveFilter
											? 'No courses match your filters.'
											: 'No published courses yet.'}
									</Typography>
									{hasActiveFilter && (
										<Button onClick={clearAll} sx={{ mt: 2 }}>
											Clear filters
										</Button>
									)}
								</Box>
							) : (
								<Grid container spacing={3}>
									{fetchState.courses.map((course) => (
										<Grid
											key={course._id}
											size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
										>
											<CourseCard
												course={course}
												basePath='/courses'
												isEnrolled={enrolledCourseIds.includes(course._id)}
												learningPath={`/student/courses/${course._id}/learn`}
											/>
										</Grid>
									))}
								</Grid>
							)}
							{pagination && (
								<AppPagination
									page={pagination.page}
									totalPages={pagination.totalPages}
									totalItems={pagination.total}
									pageSize={pagination.limit}
									disabled={loading}
									onChange={(page) => {
										updateParams({
											page: page > 1 ? String(page) : null,
										});
										document
											.getElementById('courses-section')
											?.scrollIntoView({ behavior: 'smooth' });
									}}
								/>
							)}
						</Box>
					</Box>
				</Container>
			</Box>

			{/* ── Footer ───────────────────────────────────────────────── */}
			<RenderWhenNearViewport minHeight={180} rootMargin='700px'>
				<Box
					sx={{
						position: 'relative',
						overflow: 'hidden',
						color: 'white',
						background:
							'linear-gradient(135deg, #050816 0%, #18204f 38%, #123c49 72%, #2d1b69 100%)',
						'&::before': {
							content: '""',
							position: 'absolute',
							inset: 0,
							background:
								'radial-gradient(circle at 18% 22%, rgba(255,209,102,0.18), transparent 28%), radial-gradient(circle at 84% 18%, rgba(255,107,107,0.13), transparent 27%), radial-gradient(circle at 72% 82%, rgba(20,184,166,0.18), transparent 30%), linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.1) 45%, transparent 62%)',
							backgroundSize: '100% 100%, 100% 100%, 240% 100%',
							animation: 'ecosystemBandShine 7s ease-in-out infinite',
						},
						'&::after': {
							content: '""',
							position: 'absolute',
							left: 0,
							right: 0,
							bottom: 0,
							height: 1,
							background:
								'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
						},
						'@keyframes ecosystemBandShine': {
							'0%, 100%': { backgroundPosition: '0 0, 0 0, -140% 0' },
							'50%': { backgroundPosition: '0 0, 0 0, 160% 0' },
						},
					}}
				>
				<Container maxWidth='xl' sx={{ position: 'relative', py: { xs: 7, md: 9 } }}>
					<Grid container spacing={5} sx={{ alignItems: 'center' }}>
						<Grid size={{ xs: 12, md: 5 }}>
							<Chip
								label='Complete learning ecosystem'
								size='small'
								sx={{
									fontWeight: 800,
									mb: 2,
									color: 'white',
									bgcolor: 'rgba(255,255,255,0.14)',
									border: '1px solid rgba(255,255,255,0.22)',
								}}
							/>
							<Typography
								variant='h3'
								sx={{
									fontWeight: 900,
									fontSize: { xs: '2rem', md: '2.8rem' },
									lineHeight: 1.1,
									mb: 2,
									maxWidth: 640,
								}}
							>
								A platform built for courses, classes, quizzes, and real outcomes
							</Typography>
							<Typography
								variant='body1'
								sx={{ lineHeight: 1.8, mb: 3, color: 'rgba(255,255,255,0.78)' }}
							>
								MedhaBee brings live learning, recorded lessons, seminars,
								language programs, portfolio building, and community discussion
								into one connected student experience.
							</Typography>
							<Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
								{['Live', 'Recorded', 'Seminar', 'Language', 'Quiz', 'Portfolio'].map(
									(item) => (
										<Chip
											key={item}
											label={item}
											sx={{
												fontWeight: 800,
												color: 'white',
												bgcolor: 'rgba(255,255,255,0.1)',
												border: '1px solid rgba(255,255,255,0.18)',
											}}
										/>
									),
								)}
							</Box>
						</Grid>
						<Grid size={{ xs: 12, md: 7 }}>
							<Box
								sx={{
									position: 'relative',
									minHeight: { xs: 320, md: 440 },
									'&::before': {
										content: '""',
										position: 'absolute',
										inset: { xs: 20, md: 32 },
										borderRadius: '50%',
										background:
											'radial-gradient(circle, rgba(255,209,102,0.2), rgba(255,255,255,0.08) 34%, transparent 64%)',
										filter: 'blur(6px)',
									},
								}}
							>
								<Suspense
									fallback={
										<Box
											sx={{
												width: '100%',
												height: { xs: 300, md: 420 },
											}}
										/>
									}
								>
									<ThreeLearningScene />
								</Suspense>
								<Box
									sx={{
										position: 'absolute',
										left: 18,
										right: 18,
										bottom: 18,
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
										gap: 1,
									}}
								>
									{['Learn', 'Practice', 'Showcase'].map((item) => (
										<Box
											key={item}
											sx={{
												bgcolor: 'rgba(255,255,255,0.12)',
												color: 'white',
												border: '1px solid rgba(255,255,255,0.18)',
												backdropFilter: 'blur(8px)',
												borderRadius: 1,
												px: 1.5,
												py: 1,
											}}
										>
											<Typography sx={{ fontWeight: 800 }}>{item}</Typography>
										</Box>
									))}
								</Box>
							</Box>
						</Grid>
					</Grid>
				</Container>
				</Box>
			</RenderWhenNearViewport>

			{courseTypes.length > 0 && (
			<Box sx={{ bgcolor: 'background.paper' }}>
				<Container maxWidth='xl' sx={{ py: { xs: 6, md: 8 } }}>
					<Box sx={{ mb: 4, maxWidth: 720 }}>
						<Typography variant='h4' sx={{ fontWeight: 900 }}>
							Learn what matches your ambition
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
							These learning paths come directly from the course types available
							on the platform, so students see real options they can explore.
						</Typography>
					</Box>
					<Grid container spacing={2.5}>
						{courseTypes.map((courseType, index) => {
							const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

							return (
							<Grid key={courseType._id} size={{ xs: 12, sm: 6, md: 3 }}>
								<CardActionArea
									component={RouterLink}
									to={`/courses?courseTypes=${encodeParam(courseType._id)}`}
									sx={{
										height: '100%',
										minHeight: 210,
										p: 2.75,
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'divider',
										bgcolor: 'background.paper',
										position: 'relative',
										overflow: 'hidden',
										display: 'flex',
										alignItems: 'stretch',
										textDecoration: 'none',
										transition: 'transform 0.25s ease, box-shadow 0.25s ease',
										'&::before': {
											content: '""',
											position: 'absolute',
											inset: 0,
											background: `${gradient}, linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.58) 45%, transparent 62%)`,
											backgroundSize: '240% 240%, 260% 100%',
											opacity: 0.2,
											animation:
												'courseTypeGradient 5.5s ease-in-out infinite, courseTypeShine 5s ease-in-out infinite',
										},
										'&::after': {
											content: '""',
											position: 'absolute',
											width: 128,
											height: 128,
											borderRadius: '50%',
											right: -42,
											top: -48,
											background: gradient,
											opacity: 0.18,
											filter: 'blur(1px)',
										},
										'&:hover': {
											transform: 'translateY(-4px)',
											boxShadow: '0 16px 36px rgba(15,23,42,0.11)',
										},
										'&:hover .course-type-arrow': {
											transform: 'translateX(4px)',
											opacity: 1,
										},
										'@keyframes courseTypeGradient': {
											'0%, 100%': { backgroundPosition: '0% 50%, -140% 0' },
											'50%': { backgroundPosition: '100% 50%, 160% 0' },
										},
										'@keyframes courseTypeShine': {
											'0%, 35%': { filter: 'saturate(1.05) brightness(1)' },
											'65%': { filter: 'saturate(1.35) brightness(1.08)' },
											'100%': { filter: 'saturate(1.05) brightness(1)' },
										},
									}}
								>
									<Box
										sx={{
											position: 'relative',
											display: 'flex',
											flexDirection: 'column',
											width: '100%',
										}}
									>
										<Chip
											label={`Path ${index + 1}`}
											size='small'
											sx={{ fontWeight: 800, mb: 2, alignSelf: 'flex-start' }}
										/>
										<Typography
											variant='h4'
											sx={{
												fontWeight: 950,
												lineHeight: 1.05,
												mb: 1.5,
												background: gradient,
												WebkitBackgroundClip: 'text',
												WebkitTextFillColor: 'transparent',
												overflowWrap: 'anywhere',
											}}
										>
											{courseType.name}
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{ lineHeight: 1.7 }}
										>
											{courseType.description ||
												'Explore courses, teachers, and learning materials in this track.'}
										</Typography>
										<Box sx={{ flexGrow: 1 }} />
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 0.75,
												mt: 2,
												color: 'primary.main',
												fontWeight: 800,
											}}
										>
											<Typography variant='body2' sx={{ fontWeight: 800 }}>
												Explore courses
											</Typography>
											<ArrowForwardIcon
												className='course-type-arrow'
												sx={{
													fontSize: 18,
													opacity: 0.65,
													transition: 'transform 0.25s ease, opacity 0.25s ease',
												}}
											/>
										</Box>
									</Box>
								</CardActionArea>
							</Grid>
							);
						})}
					</Grid>
				</Container>
			</Box>
			)}

			<Box sx={{ bgcolor: 'grey.50' }}>
				<Container maxWidth='xl' sx={{ py: { xs: 6, md: 8 } }}>
					<Grid container spacing={4}>
						<Grid size={{ xs: 12, md: 5 }}>
							<Typography variant='h4' sx={{ fontWeight: 900, mb: 1 }}>
								Class options for every learner
							</Typography>
							<Typography color='text.secondary' sx={{ lineHeight: 1.8 }}>
								Support focused personal coaching, group momentum, and full
								batch-based programs from the same platform.
							</Typography>
						</Grid>
						<Grid size={{ xs: 12, md: 7 }}>
							<Grid container spacing={2}>
								{CLASS_OPTIONS.map((item, index) => (
									<Grid key={item.title} size={{ xs: 12, sm: 6 }}>
										<Box
											sx={{
												height: '100%',
												p: 2,
												borderRadius: 1,
												bgcolor: 'background.paper',
												border: '1px solid',
												borderColor: 'divider',
												position: 'relative',
												overflow: 'hidden',
												transition: 'transform 0.25s ease, box-shadow 0.25s ease',
												'&::before': {
													content: '""',
													position: 'absolute',
													inset: 0,
													background:
														CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length],
													opacity: 0.08,
												},
												'&:hover': {
													transform: 'translateY(-3px)',
													boxShadow: '0 12px 30px rgba(15,23,42,0.1)',
												},
											}}
										>
											<Box sx={{ position: 'relative', display: 'flex', gap: 1.5 }}>
												<Box
													sx={{
														width: 42,
														height: 42,
														borderRadius: 1,
														flexShrink: 0,
														display: 'grid',
														placeItems: 'center',
														color: 'white',
														fontWeight: 900,
														background:
															CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length],
														boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
													}}
												>
													{index + 1}
												</Box>
												<Box>
													<Typography sx={{ fontWeight: 850, mb: 0.5 }}>
														{item.title}
													</Typography>
													<Typography
														variant='body2'
														color='text.secondary'
														sx={{ lineHeight: 1.6 }}
													>
														{item.description}
													</Typography>
												</Box>
											</Box>
										</Box>
									</Grid>
								))}
							</Grid>
						</Grid>
					</Grid>
				</Container>
			</Box>

			<Box sx={{ bgcolor: 'background.paper' }}>
				<Container maxWidth='xl' sx={{ py: { xs: 6, md: 8 } }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: { xs: 'flex-start', md: 'flex-end' },
							gap: 2,
							mb: 4,
							flexDirection: { xs: 'column', md: 'row' },
						}}
					>
						<Box sx={{ maxWidth: 760 }}>
							<Typography variant='h4' sx={{ fontWeight: 900 }}>
								More than watching lessons
							</Typography>
							<Typography
								variant='body1'
								color='text.secondary'
								sx={{ mt: 1, lineHeight: 1.7 }}
							>
								Students can practice, discuss, collect resources, and build a
								portfolio that shows what they can actually do.
							</Typography>
						</Box>
						<Button
							component={RouterLink}
							to='/auth/register'
							variant='contained'
							sx={{ fontWeight: 800 }}
						>
							Start learning
						</Button>
					</Box>

					<Grid container spacing={2.5}>
						{PLATFORM_TOOLS.map((item, index) => (
							<Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
								<Box
									sx={{
										height: '100%',
										p: 2.5,
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'divider',
										bgcolor: index % 2 === 0 ? 'grey.50' : 'background.paper',
										display: 'flex',
										flexDirection: 'column',
										gap: 1.5,
										transition: 'transform 0.25s ease, border-color 0.25s ease',
										'&:hover': {
											transform: 'translateY(-4px)',
											borderColor: 'primary.light',
										},
									}}
								>
									<Box
										sx={{
											width: 44,
											height: 44,
											borderRadius: 1,
											background: CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length],
										}}
									/>
									<Typography variant='h6' sx={{ fontWeight: 850 }}>
										{item.title}
									</Typography>
									<Typography
										variant='body2'
										color='text.secondary'
										sx={{ lineHeight: 1.7 }}
									>
										{item.description}
									</Typography>
								</Box>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			<RenderWhenNearViewport minHeight={160} rootMargin='700px'>
				<Suspense fallback={null}>
					<TeacherMarqueeSection teachers={teachers} />
				</Suspense>
			</RenderWhenNearViewport>

			<Box sx={{ bgcolor: 'grey.900', color: 'grey.400', py: 5 }}>
				<Container maxWidth='lg'>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							flexWrap: 'wrap',
							gap: 2,
							mb: 3,
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<SchoolIcon sx={{ color: 'primary.light', fontSize: 28 }} />
							<Typography
								variant='h6'
								sx={{ color: 'white', fontWeight: 800, letterSpacing: -0.5 }}
							>
								MedhaBee
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', gap: 3 }}>
							{['About', 'Courses', 'Teachers', 'Contact'].map((item) => (
								<Typography
									key={item}
									variant='body2'
									sx={{
										cursor: 'pointer',
										'&:hover': { color: 'white' },
										transition: 'color 0.2s',
									}}
								>
									{item}
								</Typography>
							))}
						</Box>
					</Box>
					<Divider sx={{ borderColor: 'grey.800', mb: 3 }} />
					<Typography variant='body2' sx={{ textAlign: 'center' }}>
						© {new Date().getFullYear()} MedhaBee E-Learning Platform. All
						rights reserved.
					</Typography>
				</Container>
			</Box>
		</Box>
	);
}
