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
	IconButton,
	Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { courseService } from '../services/course.service';
import { categoryService } from '../services/category.service';
import { courseTypeService } from '../services/courseType.service';
import { teacherService } from '../services/teacher.service';
import { homeHeroPostService } from '../services/homeHeroPost.service';
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
	CoursePricing,
	ICourseFilterCounts,
	IHomeHeroPost,
	SubscriptionPlan,
} from '../types/index';

const CATEGORY_GRADIENTS = [
	'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
	'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
	'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)',
	'linear-gradient(135deg, #86198f 0%, #ec4899 100%)',
	'linear-gradient(135deg, #166534 0%, #84cc16 100%)',
	'linear-gradient(135deg, #4338ca 0%, #a78bfa 100%)',
];

const HOME_HERO_FALLBACK_IMAGE =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 460'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0' stop-color='%230b1f4d'/%3E%3Cstop offset='0.56' stop-color='%231b6dc8'/%3E%3Cstop offset='1' stop-color='%2308a5dd'/%3E%3C/linearGradient%3E%3CradialGradient id='b' cx='0.14' cy='0.42' r='0.45'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.18'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='0.83' cy='0.48' r='0.2'%3E%3Cstop offset='0' stop-color='%237dd3fc' stop-opacity='0.22'/%3E%3Cstop offset='1' stop-color='%237dd3fc' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='2048' height='460' fill='url(%23a)'/%3E%3Ccircle cx='1960' cy='88' r='164' fill='%23ffffff' opacity='0.1'/%3E%3Ccircle cx='58' cy='278' r='132' fill='%23ffffff' opacity='0.1'/%3E%3Crect width='2048' height='460' fill='url(%23b)'/%3E%3Crect width='2048' height='460' fill='url(%23c)'/%3E%3C/svg%3E";
const SHOW_LEGACY_HERO_COPY = Boolean(
	import.meta.env.VITE_SHOW_LEGACY_HERO_COPY,
);

const HOME_COURSES_PAGE_SIZE = 8;
const HOME_COURSE_SKELETONS = Array.from({ length: HOME_COURSES_PAGE_SIZE });
const ThreeLearningScene = lazy(
	() => import('../components/home/ThreeLearningScene'),
);
const TeacherMarqueeSection = lazy(
	() => import('../components/teacher/TeacherMarqueeSection'),
);

const HomePage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const paramsKey = searchParams.toString();

	// All filter values derived from URL (decoded) ───

	const urlSearch = decodeParam(searchParams.get('q') ?? '');
	const urlCourseTypes = decodeParam(searchParams.get('courseTypes') ?? '')
		.split(',')
		.filter(Boolean);
	const urlCategories = decodeParam(searchParams.get('categories') ?? '')
		.split(',')
		.filter(Boolean);
	const urlPricing = decodeParam(searchParams.get('pricing') ?? '')
		.split(',')
		.filter(
			(value): value is CoursePricing => value === 'Free' || value === 'Paid',
		);
	const urlPlans = decodeParam(searchParams.get('subscriptionPlans') ?? '')
		.split(',')
		.filter(Boolean) as SubscriptionPlan[];
	const urlPage = Math.max(
		Number(decodeParam(searchParams.get('page') ?? '')) || 1,
		1,
	);

	// ── Local state for search input only (smooth typing) ───
	const [searchInput, setSearchInput] = useState(urlSearch);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isDebouncing = useRef(false);

	// ── Reference data
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [heroPosts, setHeroPosts] = useState<IHomeHeroPost[]>([]);
	const [heroSlide, setHeroSlide] = useState(0);
	const { user, isLoading: authLoading } = useAuth();
	const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

	// ── Fetch state: derived loading ─────────────────────────────
	const [fetchState, setFetchState] = useState<{
		key: string;
		courses: ICourse[];
		pagination: IPaginationMeta | null;
		filterCounts?: ICourseFilterCounts;
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
		homeHeroPostService
			.getPublic()
			.then((res) => setHeroPosts(res.data ?? []))
			.catch(() => setHeroPosts([]));
	}, []);

	useEffect(() => {
		if (heroPosts.length <= 1) return;
		const timer = setInterval(() => {
			setHeroSlide((current) => (current + 1) % heroPosts.length);
		}, 5000);
		return () => clearInterval(timer);
	}, [heroPosts.length]);

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
		if (urlPricing.length > 0) params.pricing = urlPricing.join(',');
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
					filterCounts: res.filterCounts,
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

	const togglePricing = (pricing: CoursePricing) => {
		const next = urlPricing.includes(pricing)
			? urlPricing.filter((x) => x !== pricing)
			: [...urlPricing, pricing];
		updateParams({ pricing: next.join(',') || null, page: null });
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
		urlCourseTypes.length +
		urlCategories.length +
		urlPricing.length +
		urlPlans.length;
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
					background: 'background.default',
					color: 'white',
				}}
			>
				{heroPosts.length > 0 ? (
					<Box
						sx={{
							position: 'relative',
							height: { xs: 320, sm: 380, md: 446 },
							bgcolor: 'grey.100',
							'&:hover .hero-slider-arrow, &:focus-within .hero-slider-arrow': {
								opacity: 1,
								pointerEvents: 'auto',
							},
						}}
					>
						{heroPosts.map((post, index) => (
							<Box
								key={post._id}
								component='img'
								src={post.imageUrl}
								alt=''
								loading={index === 0 ? 'eager' : 'lazy'}
								sx={{
									position: 'absolute',
									inset: 0,
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									opacity: index === heroSlide ? 1 : 0,
									transform: index === heroSlide ? 'scale(1)' : 'scale(1.04)',
									filter: index === heroSlide ? 'none' : 'saturate(0.9)',
									transition:
										'opacity 0.65s ease, transform 1.1s ease, filter 0.65s ease',
								}}
							/>
						))}
						{heroPosts.length > 1 && (
							<>
								<IconButton
									className='hero-slider-arrow'
									aria-label='Previous header image'
									onClick={() =>
										setHeroSlide(
											(current) =>
												(current - 1 + heroPosts.length) % heroPosts.length,
										)
									}
									sx={{
										position: 'absolute',
										left: { xs: 12, md: 24 },
										top: '50%',
										transform: 'translateY(-50%)',
										width: { xs: 42, md: 50 },
										height: { xs: 42, md: 50 },
										opacity: 0,
										pointerEvents: 'none',
										bgcolor: '#0ea5e9',
										color: 'common.white',
										border: '2px solid rgba(255,255,255,0.8)',
										boxShadow: '0 14px 34px rgba(14, 165, 233, 0.38)',
										transition:
											'opacity 0.22s ease, transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
										'&:hover': {
											bgcolor: '#0369a1',
											transform: 'translateY(-50%) scale(1.08)',
											boxShadow: '0 18px 42px rgba(14, 165, 233, 0.48)',
										},
									}}
								>
									<ChevronLeftIcon sx={{ fontSize: 30 }} />
								</IconButton>
								<IconButton
									className='hero-slider-arrow'
									aria-label='Next header image'
									onClick={() =>
										setHeroSlide((current) => (current + 1) % heroPosts.length)
									}
									sx={{
										position: 'absolute',
										right: { xs: 12, md: 24 },
										top: '50%',
										transform: 'translateY(-50%)',
										width: { xs: 42, md: 50 },
										height: { xs: 42, md: 50 },
										opacity: 0,
										pointerEvents: 'none',
										bgcolor: '#0ea5e9',
										color: 'common.white',
										border: '2px solid rgba(255,255,255,0.8)',
										boxShadow: '0 14px 34px rgba(14, 165, 233, 0.38)',
										transition:
											'opacity 0.22s ease, transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
										'&:hover': {
											bgcolor: '#0369a1',
											transform: 'translateY(-50%) scale(1.08)',
											boxShadow: '0 18px 42px rgba(14, 165, 233, 0.48)',
										},
									}}
								>
									<ChevronRightIcon sx={{ fontSize: 30 }} />
								</IconButton>
								<Box
									sx={{
										position: 'absolute',
										left: 0,
										right: 0,
										bottom: 18,
										display: 'flex',
										justifyContent: 'center',
										gap: 1,
									}}
								>
									{heroPosts.map((post, index) => (
										<Box
											key={post._id}
											component='button'
											aria-label={`Show header image ${index + 1}`}
											onClick={() => setHeroSlide(index)}
											sx={{
												width: index === heroSlide ? 22 : 8,
												height: 8,
												border: 0,
												borderRadius: 8,
												p: 0,
												cursor: 'pointer',
												bgcolor:
													index === heroSlide
														? '#facc15'
														: 'rgba(250,204,21,0.48)',
												boxShadow:
													index === heroSlide
														? '0 0 16px rgba(250,204,21,0.55)'
														: 'none',
												transition:
													'width 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
											}}
										/>
									))}
								</Box>
							</>
						)}
					</Box>
				) : (
					<>
						<Box
							component='img'
							src={HOME_HERO_FALLBACK_IMAGE}
							alt=''
							sx={{
								width: '100%',
								height: { xs: 320, sm: 380, md: 446 },
								objectFit: 'cover',
								display: 'block',
							}}
						/>
						{SHOW_LEGACY_HERO_COPY && (
							<>
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
											Explore expert-taught courses in technology, design,
											business, and more. Advance your career at your own pace —
											anytime, anywhere.
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
							</>
						)}
					</>
				)}
			</Box>

			{/* ── Stats bar ────────────────────────────────────────────── */}
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
									<Grid
										key={category._id}
										size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
									>
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
													transform:
														'translateY(-2px) rotate(-3deg) scale(1.04)',
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
														'0%, 100%': {
															boxShadow: '0 10px 22px rgba(15,23,42,0.18)',
														},
														'50%': {
															boxShadow: '0 14px 28px rgba(15,23,42,0.24)',
														},
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
													transition:
														'opacity 0.25s ease, transform 0.25s ease',
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
								selectedPricing={urlPricing}
								onTogglePricing={togglePricing}
								selectedPlans={urlPlans}
								onTogglePlan={togglePlan}
								filterCounts={fetchState.filterCounts}
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
											<CourseCardSkeleton
												showAction={user?.role === 'Student'}
											/>
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
					<Container
						maxWidth='xl'
						sx={{ position: 'relative', py: { xs: 7, md: 9 } }}
					>
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
									A platform built for courses, classes, quizzes, and real
									outcomes
								</Typography>
								<Typography
									variant='body1'
									sx={{
										lineHeight: 1.8,
										mb: 3,
										color: 'rgba(255,255,255,0.78)',
									}}
								>
									MedhaBee brings live learning, recorded lessons, seminars,
									language programs, portfolio building, and community
									discussion into one connected student experience.
								</Typography>
								<Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
									{[
										'Live',
										'Recorded',
										'Seminar',
										'Language',
										'Quiz',
										'Portfolio',
									].map((item) => (
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
									))}
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
								These learning paths come directly from the course types
								available on the platform, so students see real options they can
								explore.
							</Typography>
						</Box>
						<Grid container spacing={2.5}>
							{courseTypes.map((courseType, index) => {
								const gradient =
									CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

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
												transition:
													'transform 0.25s ease, box-shadow 0.25s ease',
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
													sx={{
														fontWeight: 800,
														mb: 2,
														alignSelf: 'flex-start',
													}}
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
															transition:
																'transform 0.25s ease, opacity 0.25s ease',
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
};

export default HomePage;
