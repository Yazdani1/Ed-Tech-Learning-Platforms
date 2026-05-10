import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Chip,
	CircularProgress,
	Container,
	Divider,
	Grid,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import SchoolIcon from '@mui/icons-material/School';
import toast from 'react-hot-toast';
import PublicNavbar from '../../components/layout/PublicNavbar';
import AppModal from '../../components/common/AppModal';
import CourseFilterSidebar from '../../components/course/CourseFilterSidebar';
import CourseCard, { CourseCardSkeleton } from '../../components/ui/CourseCard';
import { categoryService } from '../../services/category.service';
import { courseService } from '../../services/course.service';
import { courseTypeService } from '../../services/courseType.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { subscriptionService } from '../../services/subscription.service';
import type { ICategory, ICourse, ICourseType, ISubscriptionPlanConfig, CoursePricing, SubscriptionPlan } from '../../types/index';
import { useAuth } from '../../context/useAuth';
import { formatDate } from '../../utils/dateTime';

const DEFAULT_COLORS: Record<string, string> = {
	Basic: '#0284c7',
	Premium: '#7c3aed',
	Gold: '#d97706',
	'Quiz Only': '#059669',
};

const getBillingOptions = (plan: ISubscriptionPlanConfig) =>
	plan.billingOptions?.length
		? plan.billingOptions
		: [{ label: plan.duration === 1 ? 'Monthly' : `${plan.duration} months`, duration: plan.duration, price: plan.price }];

const getDurationLabel = (duration: number) => {
	if (duration === 1) return 'Monthly';
	if (duration === 3) return '3 months';
	if (duration === 6) return '6 months';
	if (duration === 12) return 'Yearly';
	return `${duration} months`;
};

const getSavingsInfo = (
	billingOptions: ReturnType<typeof getBillingOptions>,
	selectedOption?: ReturnType<typeof getBillingOptions>[number],
) => {
	const monthlyOption = billingOptions.find((option) => option.duration === 1);
	if (!monthlyOption || !selectedOption || selectedOption.duration <= 1) return null;

	const monthlyTotal = monthlyOption.price * selectedOption.duration;
	const savings = monthlyTotal - selectedOption.price;
	if (savings <= 0) return null;

	return {
		savings,
		percent: Math.round((savings / monthlyTotal) * 100),
		monthlyEquivalent: Math.round(selectedOption.price / selectedOption.duration),
	};
};

const PLAN_COURSE_SKELETONS = Array.from({ length: 8 });

function PlanCoursesModal({
	plan,
	open,
	onClose,
}: {
	plan: ISubscriptionPlanConfig | null;
	open: boolean;
	onClose: () => void;
}) {
	const { user, isLoading: authLoading } = useAuth();
	const [searchInput, setSearchInput] = useState('');
	const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>([]);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedPricing, setSelectedPricing] = useState<CoursePricing[]>([]);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		Promise.all([categoryService.getAll(), courseTypeService.getAll()]).then(([catRes, typeRes]) => {
			setCategories(catRes.data ?? []);
			setCourseTypes(typeRes.data ?? []);
		});
	}, [open]);

	useEffect(() => {
		if (!open || authLoading) return;
		if (user?.role === 'Student') {
			courseService
				.getEnrolled()
				.then((res) => setEnrolledCourseIds((res.data ?? []).map((course) => course._id)))
				.catch(() => setEnrolledCourseIds([]));
		} else {
			setEnrolledCourseIds([]);
		}
	}, [authLoading, open, user]);

	useEffect(() => {
		if (!open || !plan) return;

		const params: Record<string, string> = {
			subscriptionPlans: plan.plan,
			limit: '100',
		};
		if (searchInput.trim()) params.search = searchInput.trim();
		if (selectedCourseTypes.length > 0) params.courseTypes = selectedCourseTypes.join(',');
		if (selectedCategories.length > 0) params.categories = selectedCategories.join(',');
		if (selectedPricing.length > 0) params.pricing = selectedPricing.join(',');

		setLoading(true);
		courseService
			.browse(params)
			.then((res) => {
				const data = res.data;
				setCourses(Array.isArray(data) ? data.filter((course): course is ICourse => Boolean(course?._id)) : []);
			})
			.catch(() => setCourses([]))
			.finally(() => setLoading(false));
	}, [open, plan, searchInput, selectedCategories, selectedCourseTypes, selectedPricing]);

	const toggleCourseType = (id: string) => {
		setSelectedCourseTypes((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
	};

	const toggleCategory = (id: string) => {
		setSelectedCategories((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
	};

	const togglePricing = (pricing: CoursePricing) => {
		setSelectedPricing((current) => (current.includes(pricing) ? current.filter((item) => item !== pricing) : [...current, pricing]));
	};

	const clearAll = () => {
		setSearchInput('');
		setSelectedCourseTypes([]);
		setSelectedCategories([]);
		setSelectedPricing([]);
	};

	const activeFilterCount = selectedCourseTypes.length + selectedCategories.length + selectedPricing.length;
	const hasActiveFilter = Boolean(searchInput.trim()) || activeFilterCount > 0;

	return (
		<AppModal
			open={open}
			onClose={onClose}
			title={plan ? `${plan.plan} included courses` : 'Included courses'}
			maxWidth='xl'
			cancelText='Close'
			cancelButtonSx={{
				border: '1px solid',
				borderColor: 'error.main',
				color: 'error.main',
				borderRadius: 2,
				px: 2.5,
				fontWeight: 800,
				'&:hover': {
					borderColor: 'error.dark',
					bgcolor: 'error.50',
					color: 'error.dark',
				},
			}}
			contentSx={{ p: 0, height: { xs: '78vh', md: '82vh' } }}
			paperSx={{ height: { xs: '92vh', md: '88vh' } }}
		>
			<Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
				<Box
					sx={{
						width: 282,
						flexShrink: 0,
						borderRight: '1px solid',
						borderColor: 'divider',
						display: { xs: 'none', md: 'block' },
						p: 2,
						overflowY: 'auto',
					}}
				>
					<CourseFilterSidebar
						searchInput={searchInput}
						onSearchChange={setSearchInput}
						courseTypes={courseTypes}
						selectedCourseTypes={selectedCourseTypes}
						onToggleCourseType={toggleCourseType}
						categories={categories}
						selectedCategories={selectedCategories}
						onToggleCategory={toggleCategory}
						selectedPricing={selectedPricing}
						onTogglePricing={togglePricing}
						selectedPlans={plan ? [plan.plan] : []}
						onTogglePlan={() => {}}
						subscriptionPlanOptions={plan ? [plan.plan] : []}
						activeFilterCount={activeFilterCount}
						onClearAll={clearAll}
					/>
				</Box>

				<Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
					<Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
						<CourseFilterSidebar
							searchInput={searchInput}
							onSearchChange={setSearchInput}
							courseTypes={courseTypes}
							selectedCourseTypes={selectedCourseTypes}
							onToggleCourseType={toggleCourseType}
							categories={categories}
							selectedCategories={selectedCategories}
							onToggleCategory={toggleCategory}
							selectedPricing={selectedPricing}
							onTogglePricing={togglePricing}
							selectedPlans={plan ? [plan.plan] : []}
							onTogglePlan={() => {}}
							subscriptionPlanOptions={plan ? [plan.plan] : []}
							activeFilterCount={activeFilterCount}
							onClearAll={clearAll}
						/>
					</Box>

					<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 2.5 }}>
						<Typography variant='body2' color='text.secondary'>
							{loading ? 'Loading courses...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} included`}
						</Typography>
						{plan && <Chip label={plan.plan} size='small' color='primary' sx={{ fontWeight: 800 }} />}
					</Box>

					{loading ? (
						<Grid container spacing={2.5}>
							{PLAN_COURSE_SKELETONS.map((_, index) => (
								<Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
									<CourseCardSkeleton showAction={user?.role === 'Student'} />
								</Grid>
							))}
						</Grid>
					) : courses.length === 0 ? (
						<Box sx={{ textAlign: 'center', py: 8 }}>
							<Typography variant='h6' color='text.secondary'>
								{hasActiveFilter ? 'No included courses match your filters.' : 'No courses are assigned to this subscription yet.'}
							</Typography>
							{hasActiveFilter && (
								<Button onClick={clearAll} sx={{ mt: 2 }}>
									Clear filters
								</Button>
							)}
						</Box>
					) : (
						<Grid container spacing={2.5}>
							{courses.map((course) => (
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
					)}
				</Box>
			</Box>
		</AppModal>
	);
}

export default function PricingPage() {
	const { user, refreshUser } = useAuth();
	const navigate = useNavigate();
	const [plans, setPlans] = useState<ISubscriptionPlanConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
	const [courseModalPlan, setCourseModalPlan] = useState<ISubscriptionPlanConfig | null>(null);
	const [subscribing, setSubscribing] = useState<string | null>(null);

	const isStudent = user?.role === 'Student';
	const activePlan = user?.activeSubscription?.plan;
	const activeBillingDuration = user?.activeSubscription?.billingDuration;
	const activePlanExpiry = user?.activeSubscription?.endDate;
	const isActivePlanValid = activePlanExpiry && new Date(activePlanExpiry) > new Date();

	const billingDurations = useMemo(() => {
		const labels = new Map<number, string>();
		plans.forEach((plan) => {
			getBillingOptions(plan).forEach((option) => {
				if (!labels.has(option.duration)) {
					labels.set(option.duration, option.label || getDurationLabel(option.duration));
				}
			});
		});

		return Array.from(labels.entries())
			.map(([duration, label]) => ({ duration, label }))
			.sort((a, b) => a.duration - b.duration);
	}, [plans]);

	useEffect(() => {
		subscriptionPlanConfigService
			.getAll()
			.then((res) => {
				const nextPlans = res.data ?? [];
				setPlans(nextPlans);
				const durations = Array.from(
					new Set(nextPlans.flatMap((plan) => getBillingOptions(plan).map((option) => option.duration))),
				).sort((a, b) => a - b);
				setSelectedDuration((current) => (current && durations.includes(current) ? current : durations.includes(1) ? 1 : durations[0] ?? null));
			})
			.finally(() => setLoading(false));
	}, []);

	const handleSubscribe = async (plan: SubscriptionPlan, billingDuration: number) => {
		if (!user) {
			navigate('/auth/register');
			return;
		}
		if (!isStudent) {
			toast.error('Only students can subscribe to plans');
			return;
		}
		const subscribeKey = `${plan}:${billingDuration}`;
		setSubscribing(subscribeKey);
		try {
			await subscriptionService.subscribe(plan, billingDuration);
			await refreshUser?.();
			toast.success(`Subscribed to ${plan} plan!`);
		} catch {
			toast.error('Failed to subscribe. Please try again.');
		} finally {
			setSubscribing(null);
		}
	};

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			<Box sx={{ bgcolor: '#1c1d1f', color: 'white', py: { xs: 6, md: 9 }, textAlign: 'center' }}>
				<Container maxWidth='md'>
					<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
						<CardMembershipIcon sx={{ fontSize: 48, color: '#a78bfa' }} />
					</Box>
					<Typography variant='h3' sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '2.75rem' } }}>
						Choose Your Plan
					</Typography>
					<Typography variant='h6' sx={{ fontWeight: 400, opacity: 0.8, maxWidth: 560, mx: 'auto' }}>
						Unlock unlimited access to courses with a subscription that fits your learning goals.
					</Typography>
					{isStudent && isActivePlanValid && (
						<Chip
							label={`Current plan: ${activePlan} - Expires ${formatDate(activePlanExpiry!)}`}
							sx={{ mt: 3, bgcolor: '#7c3aed', color: 'white', fontWeight: 600, fontSize: '0.875rem', px: 1 }}
						/>
					)}
				</Container>
			</Box>

			<Container maxWidth='xl' sx={{ py: { xs: 5, md: 8 } }}>
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
						<CircularProgress />
					</Box>
				) : plans.length === 0 ? (
					<Box sx={{ textAlign: 'center', mt: 8 }}>
						<Typography variant='h6' color='text.secondary'>
							No subscription plans available yet. Check back soon!
						</Typography>
					</Box>
				) : (
					<>
						{billingDurations.length > 1 && (
							<Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
								<Box
									sx={{
										display: 'inline-flex',
										p: 0.75,
										borderRadius: 3,
										bgcolor: '#f8fafc',
										border: '1px solid',
										borderColor: '#dbeafe',
										boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
									}}
								>
									<ToggleButtonGroup
										exclusive
										value={selectedDuration}
										onChange={(_, value: number | null) => {
											if (!value) return;
											setSelectedDuration(value);
										}}
										sx={{
											flexWrap: 'wrap',
											justifyContent: 'center',
											gap: 0.75,
											'& .MuiToggleButtonGroup-grouped': {
												border: 0,
												m: 0,
												borderRadius: 2,
											},
											'& .MuiToggleButton-root': {
												minWidth: { xs: 92, sm: 116 },
												px: { xs: 1.5, sm: 2.25 },
												py: 1,
												color: '#334155',
												fontWeight: 800,
												textTransform: 'none',
												bgcolor: 'white',
												boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.22)',
												transition: 'all 0.18s ease',
												'&:hover': {
													bgcolor: '#eff6ff',
													color: '#1d4ed8',
													transform: 'translateY(-1px)',
												},
												'&.Mui-selected': {
													color: 'white',
													bgcolor: '#2563eb',
													boxShadow: '0 8px 18px rgba(37, 99, 235, 0.28)',
												},
												'&.Mui-selected:hover': {
													bgcolor: '#1d4ed8',
												},
											},
										}}
									>
										{billingDurations.map((option) => (
											<ToggleButton key={option.duration} value={option.duration}>
												{option.label}
											</ToggleButton>
										))}
									</ToggleButtonGroup>
								</Box>
							</Box>
						)}

						<Grid container spacing={3} sx={{ justifyContent: 'center' }}>
							{plans.map((plan) => {
								const accentColor = plan.color || DEFAULT_COLORS[plan.plan] || '#1976d2';
								const billingOptions = getBillingOptions(plan);
								const selectedOption = billingOptions.find((option) => option.duration === selectedDuration);
								const isAvailable = Boolean(selectedOption);
								const savingsInfo = getSavingsInfo(billingOptions, selectedOption);
								const isCurrent =
									Boolean(selectedOption) &&
									isStudent &&
									isActivePlanValid &&
									activePlan === plan.plan &&
									(!activeBillingDuration || activeBillingDuration === selectedOption?.duration);
								const subscribeKey = selectedOption ? `${plan.plan}:${selectedOption.duration}` : `${plan.plan}:unavailable`;

								return (
									<Grid key={plan._id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} sx={{ minWidth: { lg: 320 } }}>
									<Card
										elevation={isCurrent ? 6 : 1}
										sx={{
											borderRadius: 3,
											border: '2px solid',
											borderColor: isCurrent ? accentColor : 'divider',
											height: '100%',
											minHeight: { md: 500 },
											display: 'flex',
											flexDirection: 'column',
											transition: 'transform 0.15s, box-shadow 0.15s',
											'&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
											position: 'relative',
											overflow: 'visible',
											opacity: isAvailable ? 1 : 0.72,
										}}
									>
										{(plan.badge || isCurrent) && (
											<Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
												<Chip
													label={isCurrent ? 'Current Plan' : plan.badge}
													size='small'
													sx={{
														bgcolor: isCurrent ? '#16a34a' : accentColor,
														color: 'white',
														fontWeight: 700,
														fontSize: '0.75rem',
														px: 0.5,
													}}
												/>
											</Box>
										)}

										<CardContent sx={{ flex: 1, pt: plan.badge || isCurrent ? 3.5 : 2.5 }}>
											<Typography variant='h6' sx={{ fontWeight: 700, color: accentColor, mb: 0.5 }}>
												{plan.plan}
											</Typography>

											<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
												<Typography variant='h3' sx={{ fontWeight: 800 }}>
													{selectedOption ? `BDT ${selectedOption.price.toLocaleString()}` : 'Not available'}
												</Typography>
											</Box>
											<Typography variant='body2' color='text.secondary'>
												{selectedOption
													? `for ${selectedOption.duration === 1 ? '1 month' : `${selectedOption.duration} months`}`
													: `This plan does not offer ${selectedDuration ? getDurationLabel(selectedDuration).toLowerCase() : 'this billing duration'}`}
											</Typography>

											{savingsInfo && (
												<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.25 }}>
													<Chip
														label={`Save BDT ${savingsInfo.savings.toLocaleString()} (${savingsInfo.percent}%)`}
														size='small'
														color='success'
														sx={{ fontWeight: 800 }}
													/>
													<Typography variant='caption' color='text.secondary' sx={{ alignSelf: 'center' }}>
														BDT {savingsInfo.monthlyEquivalent.toLocaleString()}/mo equivalent
													</Typography>
												</Box>
											)}

											{plan.courseCount > 0 && (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, mb: 0.5 }}>
													<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accentColor, flexShrink: 0 }} />
													<Typography variant='caption' sx={{ color: accentColor, fontWeight: 700 }}>
														{plan.courseCount} course{plan.courseCount !== 1 ? 's' : ''} included free
													</Typography>
												</Box>
											)}

											<Divider sx={{ my: 2 }} />

											<Box
												sx={{
													borderTop: '1px solid',
													borderColor: 'divider',
												}}
											>
												{plan.features.map((feat, i) => (
													<Box
														key={i}
														sx={{
															display: 'flex',
															gap: 1.25,
															alignItems: 'flex-start',
															px: 0,
															py: 1.1,
															borderBottom: '1px solid',
															borderColor: 'divider',
														}}
													>
														<Box
															sx={{
																width: 22,
																height: 22,
																borderRadius: '50%',
																bgcolor: `${accentColor}14`,
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																flexShrink: 0,
															}}
														>
															<CheckIcon sx={{ fontSize: 15, color: accentColor }} />
														</Box>
														<Typography variant='body2' sx={{ lineHeight: 1.5 }}>
															{feat}
														</Typography>
													</Box>
												))}
											</Box>
										</CardContent>

										<CardActions sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
											{plan.courseCount > 0 && (
												<Button
													fullWidth
													size='small'
													variant='contained'
													startIcon={<SchoolIcon fontSize='small' />}
													onClick={() => setCourseModalPlan(plan)}
													sx={{
														borderRadius: 999,
														fontWeight: 900,
														textTransform: 'none',
														py: 0.85,
														color: 'white',
														bgcolor: accentColor,
														boxShadow: `0 10px 20px ${accentColor}33`,
														background: `linear-gradient(135deg, ${accentColor} 0%, #0ea5e9 100%)`,
														'&:hover': {
															bgcolor: accentColor,
															boxShadow: `0 14px 28px ${accentColor}40`,
															transform: 'translateY(-1px)',
														},
													}}
												>
													View Included Courses ({plan.courseCount})
												</Button>
											)}
											{!selectedOption ? (
												<Button fullWidth variant='outlined' disabled sx={{ borderRadius: 2, fontWeight: 700 }}>
													Not Available
												</Button>
											) : isCurrent ? (
												<Button fullWidth variant='outlined' disabled sx={{ borderRadius: 2, fontWeight: 700 }}>
													Active Plan
												</Button>
											) : isStudent && isActivePlanValid ? (
												<Button
													fullWidth
													variant='contained'
													disabled={!selectedOption || subscribing === subscribeKey}
													onClick={() => selectedOption && void handleSubscribe(plan.plan, selectedOption.duration)}
													sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accentColor, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}
												>
													{subscribing === subscribeKey ? <CircularProgress size={20} color='inherit' /> : activePlan === plan.plan ? 'Switch Billing' : 'Switch Plan'}
												</Button>
											) : !user ? (
												<Button
													fullWidth
													variant='contained'
													component={RouterLink}
													to='/auth/register'
													sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accentColor, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}
												>
													Get Started
												</Button>
											) : (
												<Button
													fullWidth
													variant='contained'
													disabled={!selectedOption || subscribing === subscribeKey}
													onClick={() => selectedOption && void handleSubscribe(plan.plan, selectedOption.duration)}
													sx={{ borderRadius: 2, fontWeight: 700, bgcolor: accentColor, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}
												>
													{subscribing === subscribeKey ? <CircularProgress size={20} color='inherit' /> : 'Subscribe'}
												</Button>
											)}
										</CardActions>
									</Card>
								</Grid>
							);
						})}
						</Grid>
					</>
				)}

				{!user && plans.length > 0 && (
					<Box
						sx={{
							mt: 7,
							p: 4,
							borderRadius: 3,
							bgcolor: 'grey.50',
							border: '1px solid',
							borderColor: 'divider',
							textAlign: 'center',
						}}
					>
						<Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
							Already have an account?
						</Typography>
						<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
							Sign in to subscribe and start learning.
						</Typography>
						<Button component={RouterLink} to='/auth/login' variant='outlined' sx={{ fontWeight: 600, mr: 1 }}>
							Sign In
						</Button>
						<Button component={RouterLink} to='/auth/register' variant='contained' sx={{ fontWeight: 600 }}>
							Create Account
						</Button>
					</Box>
				)}
			</Container>
			<PlanCoursesModal
				plan={courseModalPlan}
				open={Boolean(courseModalPlan)}
				onClose={() => setCourseModalPlan(null)}
			/>
		</Box>
	);
}
