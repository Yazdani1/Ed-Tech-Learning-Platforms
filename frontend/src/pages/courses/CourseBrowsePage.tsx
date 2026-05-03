import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	Box,
	Chip,
	CircularProgress,
	Container,
	Grid,
	Typography,
} from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import CourseCard from '../../components/ui/CourseCard';
import PublicNavbar from '../../components/layout/PublicNavbar';
import CourseFilterSidebar from '../../components/course/CourseFilterSidebar';
import { encodeParam, decodeParam } from '../../utils/urlParams';
import type { ICourse, ICategory, ICourseType, SubscriptionPlan } from '../../types/index';

export default function CourseBrowsePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const paramsKey = searchParams.toString();

	// ── All filter values derived from URL (decoded) ────────────
	const urlSearch = decodeParam(searchParams.get('q') ?? '');
	const urlCourseTypes = decodeParam(searchParams.get('courseTypes') ?? '').split(',').filter(Boolean);
	const urlCategories = decodeParam(searchParams.get('categories') ?? '').split(',').filter(Boolean);
	const urlPlans = decodeParam(searchParams.get('subscriptionPlans') ?? '').split(',').filter(Boolean) as SubscriptionPlan[];

	// ── Local state for search input only (smooth typing) ────────
	const [searchInput, setSearchInput] = useState(urlSearch);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isDebouncing = useRef(false);

	// ── Reference data ───────────────────────────────────────────
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);

	// ── Fetch state: key tracks which params produced the current results ──
	// loading is derived: true whenever paramsKey !== fetchState.key
	const [fetchState, setFetchState] = useState<{ key: string; courses: ICourse[] }>({
		key: '__init__',
		courses: [],
	});
	const loading = fetchState.key !== paramsKey;

	// Sync URL ?q= → input when changed externally (e.g. navbar search)
	useEffect(() => {
		if (!isDebouncing.current) setSearchInput(urlSearch);
	}, [urlSearch]);

	useEffect(() => {
		Promise.all([categoryService.getAll(), courseTypeService.getAll()]).then(([cats, cts]) => {
			setCategories(cats.data ?? []);
			setCourseTypes(cts.data ?? []);
		});
	}, []);

	// Fetch courses whenever URL params change
	useEffect(() => {
		const params: Record<string, string> = {};
		if (urlSearch) params.search = urlSearch;
		if (urlCourseTypes.length > 0) params.courseTypes = urlCourseTypes.join(',');
		if (urlCategories.length > 0) params.categories = urlCategories.join(',');
		if (urlPlans.length > 0) params.subscriptionPlans = urlPlans.join(',');

		courseService
			.browse(params)
			.then((res) => {
				const data = res.data;
				setFetchState({
					key: paramsKey,
					courses: Array.isArray(data) ? data.filter((c): c is ICourse => Boolean(c?._id)) : [],
				});
			})
			.catch(() => setFetchState({ key: paramsKey, courses: [] }));
	}, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

	// ── URL helpers ──────────────────────────────────────────────
	const updateParams = (patch: Record<string, string | null>) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			for (const [key, val] of Object.entries(patch)) {
				if (val) next.set(key, encodeParam(val));
				else next.delete(key);
			}
			return next;
		}, { replace: true });
	};

	const handleSearchChange = (value: string) => {
		setSearchInput(value);
		isDebouncing.current = true;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			isDebouncing.current = false;
			updateParams({ q: value.trim() || null });
		}, 350);
	};

	const toggleCourseType = (id: string) => {
		const next = urlCourseTypes.includes(id)
			? urlCourseTypes.filter((x) => x !== id)
			: [...urlCourseTypes, id];
		updateParams({ courseTypes: next.join(',') || null });
	};

	const toggleCategory = (id: string) => {
		const next = urlCategories.includes(id)
			? urlCategories.filter((x) => x !== id)
			: [...urlCategories, id];
		updateParams({ categories: next.join(',') || null });
	};

	const togglePlan = (plan: SubscriptionPlan) => {
		const next = urlPlans.includes(plan)
			? urlPlans.filter((x) => x !== plan)
			: [...urlPlans, plan];
		updateParams({ subscriptionPlans: next.join(',') || null });
	};

	const clearAll = () => {
		setSearchInput('');
		setSearchParams({}, { replace: true });
	};

	const activeFilterCount = urlCourseTypes.length + urlCategories.length + urlPlans.length;

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			<Container maxWidth='xl' sx={{ py: 4 }}>
				<Box sx={{ mb: 3 }}>
					<Typography variant='h4' sx={{ fontWeight: 800 }}>Browse Courses</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
						{loading ? 'Loading…' : `${fetchState.courses.length} course${fetchState.courses.length !== 1 ? 's' : ''} found`}
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
					{/* ── LEFT: Filter sidebar ──────────────────────── */}
					<Box sx={{ width: 272, flexShrink: 0, position: 'sticky', top: 88 }}>
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

					{/* ── RIGHT: Course grid ────────────────────────── */}
					<Box sx={{ flex: 1, minWidth: 0 }}>
						{loading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
								<CircularProgress />
							</Box>
						) : fetchState.courses.length === 0 ? (
							<Box sx={{ textAlign: 'center', mt: 10, color: 'text.secondary' }}>
								<SchoolOutlinedIcon sx={{ fontSize: 56, mb: 2, opacity: 0.2 }} />
								<Typography variant='h6' sx={{ fontWeight: 600, mb: 0.5 }}>No courses found</Typography>
								<Typography variant='body2'>Try adjusting your filters or search term.</Typography>
							</Box>
						) : (
							<Grid container spacing={3}>
								{fetchState.courses.map((course) => (
									<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<CourseCard course={course} basePath='/courses' />
									</Grid>
								))}
							</Grid>
						)}
					</Box>
				</Box>
			</Container>
		</Box>
	);
}
