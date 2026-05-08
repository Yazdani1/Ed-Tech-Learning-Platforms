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
import toast from 'react-hot-toast';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { subscriptionService } from '../../services/subscription.service';
import type { ISubscriptionPlanConfig, SubscriptionPlan } from '../../types/index';
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

export default function PricingPage() {
	const { user, refreshUser } = useAuth();
	const navigate = useNavigate();
	const [plans, setPlans] = useState<ISubscriptionPlanConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
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

			<Container maxWidth='lg' sx={{ py: { xs: 5, md: 8 } }}>
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
										'& .MuiToggleButton-root': {
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: 2,
											px: { xs: 1.5, sm: 2.5 },
											py: 1,
											fontWeight: 700,
											textTransform: 'none',
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
									<Grid key={plan._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
									<Card
										elevation={isCurrent ? 6 : 1}
										sx={{
											borderRadius: 3,
											border: '2px solid',
											borderColor: isCurrent ? accentColor : 'divider',
											height: '100%',
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
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, mb: 0.5 }}>
													<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accentColor, flexShrink: 0 }} />
													<Typography variant='caption' sx={{ color: accentColor, fontWeight: 700 }}>
														{plan.courseCount} course{plan.courseCount !== 1 ? 's' : ''} included free
													</Typography>
												</Box>
											)}

											<Divider sx={{ my: 2 }} />

											<Box>
												{plan.features.map((feat, i) => (
													<Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 1 }}>
														<CheckIcon sx={{ fontSize: 17, color: accentColor, mt: 0.2, flexShrink: 0 }} />
														<Typography variant='body2'>{feat}</Typography>
													</Box>
												))}
											</Box>
										</CardContent>

										<CardActions sx={{ p: 2, pt: 0 }}>
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
		</Box>
	);
}
