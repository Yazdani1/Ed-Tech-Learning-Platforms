import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	Box,
	Button,
	Chip,
	Container,
	Grid,
	Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import CourseCard, { CourseCardSkeleton } from '../../components/ui/CourseCard';
import PublicNavbar from '../../components/layout/PublicNavbar';
import CourseFilterSidebar from '../../components/course/CourseFilterSidebar';
import AppPagination from '../../components/common/AppPagination';
import { useAuth } from '../../context/useAuth';
import { encodeParam, decodeParam } from '../../utils/urlParams';
import type {
	ICourse,
	ICategory,
	ICourseType,
	IPaginationMeta,
	SubscriptionPlan,
} from '../../types/index';

const COURSE_BROWSE_PAGE_SIZE = 8;
const COURSE_BROWSE_SKELETONS = Array.from({ length: COURSE_BROWSE_PAGE_SIZE });

export default function CourseBrowsePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const paramsKey = searchParams.toString();

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

	const [searchInput, setSearchInput] = useState(urlSearch);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isDebouncing = useRef(false);

	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const { user, isLoading: authLoading } = useAuth();
	const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

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
		Promise.all([categoryService.getAll(), courseTypeService.getAll()]).then(
			([cats, cts]) => {
				setCategories(cats.data ?? []);
				setCourseTypes(cts.data ?? []);
			},
		);
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
		if (urlCourseTypes.length > 0) {
			params.courseTypes = urlCourseTypes.join(',');
		}
		if (urlCategories.length > 0) params.categories = urlCategories.join(',');
		if (urlPlans.length > 0) params.subscriptionPlans = urlPlans.join(',');
		params.page = String(urlPage);
		params.limit = String(COURSE_BROWSE_PAGE_SIZE);

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

			<Container
				maxWidth='xl'
				sx={{
					py: 4,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Box sx={{ mb: 3 }}>
					<Typography variant='h4' sx={{ fontWeight: 800 }}>
						All Courses
					</Typography>
					<Typography variant='body1' color='text.secondary' sx={{ mt: 0.5 }}>
						{loading
							? 'Loading...'
							: `${fetchState.courses.length} course${fetchState.courses.length !== 1 ? 's' : ''} found`}
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

				<Box
					sx={{
						display: 'flex',
						gap: 3,
						alignItems: 'flex-start',
						flex: 1,
					}}
				>
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

					<Box
						sx={{
							flex: 1,
							minWidth: 0,
							pr: { md: 0.5 },
							pb: 6,
						}}
					>
						{loading ? (
							<Grid container spacing={3}>
								{COURSE_BROWSE_SKELETONS.map((_, index) => (
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
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}}
							/>
						)}
					</Box>
				</Box>
			</Container>
		</Box>
	);
}
