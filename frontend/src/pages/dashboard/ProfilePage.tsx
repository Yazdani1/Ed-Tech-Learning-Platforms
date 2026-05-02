import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	Paper,
	Typography,
} from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/useAuth';
import { subscriptionService } from '../../services/subscription.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import type { ISubscriptionPlanConfig } from '../../types/index';

export default function ProfilePage() {
	const { user, refreshUser } = useAuth();
	const navigate = useNavigate();
	const [planConfig, setPlanConfig] = useState<ISubscriptionPlanConfig | null>(null);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelling, setCancelling] = useState(false);

	const sub = user?.activeSubscription;
	const isStudent = user?.role === 'Student';
	const subActive = sub && new Date(sub.endDate) > new Date();

	useEffect(() => {
		if (!sub) { setPlanConfig(null); return; }
		subscriptionPlanConfigService.getAll().then((res) => {
			const configs: ISubscriptionPlanConfig[] = Array.isArray(res.data) ? res.data : [];
			const match = configs.find((c) => c.plan === sub.plan) ?? null;
			setPlanConfig(match);
		}).catch(() => {});
	}, [sub?.plan]);

	const handleCancel = async () => {
		setCancelling(true);
		try {
			await subscriptionService.cancelMy();
			await refreshUser();
			toast.success('Subscription cancelled');
			setCancelOpen(false);
		} catch {
			toast.error('Failed to cancel subscription');
		} finally {
			setCancelling(false);
		}
	};

	if (!user) {
		return (
			<Box>
				<Typography variant='h5' sx={{ fontWeight: 700, mb: 2 }}>
					My Profile
				</Typography>
				<Typography color='text.secondary'>Loading profile...</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
				My Profile
			</Typography>
			<Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
				Review your account details and membership information.
			</Typography>

			{/* Profile card */}
			<Paper
				elevation={0}
				sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}
			>
				<Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
					<Avatar
						sx={{ width: 96, height: 96, fontSize: 32, bgcolor: 'primary.main' }}
						alt={user.name}
						src={user.avatar}
					>
						{user.name?.[0]?.toUpperCase()}
					</Avatar>
					<Box>
						<Typography variant='h5' sx={{ fontWeight: 700 }}>
							{user.name}
						</Typography>
						<Typography variant='body2' color='text.secondary'>
							{user.email}
						</Typography>
						<Chip label={user.role} size='small' sx={{ mt: 1 }} />
					</Box>
				</Box>

				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
					<Chip label={`Joined: ${new Date(user.createdAt).toLocaleDateString()}`} />
					<Chip label={`Courses purchased: ${user.purchasedCourses?.length ?? 0}`} />
					{sub && (
						<Chip
							label={`Subscription: ${sub.plan}`}
							color={subActive ? 'success' : 'default'}
						/>
					)}
				</Box>
			</Paper>

			{/* Subscription management (students only) */}
			{isStudent && (
				<Paper
					elevation={0}
					sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
						<CardMembershipIcon sx={{ color: '#7c3aed' }} />
						<Typography variant='h6' sx={{ fontWeight: 700 }}>
							Subscription
						</Typography>
					</Box>

					{subActive ? (
						<>
							{/* Active plan details */}
							<Box
								sx={{
									p: 2.5,
									borderRadius: 2,
									border: '1px solid',
									borderColor: '#7c3aed',
									bgcolor: 'rgba(124,58,237,0.04)',
									mb: 2.5,
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
									<Chip
										label={sub.plan}
										size='small'
										sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 700 }}
									/>
									<Chip label='Active' size='small' color='success' />
								</Box>

								<Grid container spacing={2}>
									<Grid item xs={12} sm={4}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
											<CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
											<Box>
												<Typography variant='caption' color='text.secondary' display='block'>
													Start date
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 600 }}>
													{new Date(sub.startDate).toLocaleDateString()}
												</Typography>
											</Box>
										</Box>
									</Grid>
									<Grid item xs={12} sm={4}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
											<CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
											<Box>
												<Typography variant='caption' color='text.secondary' display='block'>
													Expiry date
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 600 }}>
													{new Date(sub.endDate).toLocaleDateString()}
												</Typography>
											</Box>
										</Box>
									</Grid>
									{planConfig && planConfig.courseCount > 0 && (
										<Grid item xs={12} sm={4}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
												<MenuBookIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
												<Box>
													<Typography variant='caption' color='text.secondary' display='block'>
														Courses included
													</Typography>
													<Typography variant='body2' sx={{ fontWeight: 600 }}>
														{planConfig.courseCount} courses free
													</Typography>
												</Box>
											</Box>
										</Grid>
									)}
								</Grid>

								{planConfig?.features && planConfig.features.length > 0 && (
									<Box sx={{ mt: 2 }}>
										<Divider sx={{ mb: 1.5 }} />
										<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
											Plan features
										</Typography>
										<Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
											{planConfig.features.map((f, i) => (
												<Chip key={i} label={f} size='small' variant='outlined' />
											))}
										</Box>
									</Box>
								)}
							</Box>

							<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
								<Button
									variant='outlined'
									onClick={() => navigate('/pricing')}
								>
									Change Plan
								</Button>
								<Button
									variant='outlined'
									color='error'
									onClick={() => setCancelOpen(true)}
								>
									Cancel Subscription
								</Button>
							</Box>
						</>
					) : (
						/* No active subscription */
						<Box
							sx={{
								p: 2.5,
								borderRadius: 2,
								border: '1px dashed',
								borderColor: 'divider',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'flex-start',
								gap: 1.5,
							}}
						>
							<Typography color='text.secondary'>
								You don&apos;t have an active subscription.
							</Typography>
							<Button variant='contained' onClick={() => navigate('/pricing')}>
								View Subscription Plans
							</Button>
						</Box>
					)}
				</Paper>
			)}

			{/* Account details */}
			<Paper
				elevation={0}
				sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
			>
				<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
					Account details
				</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>Name</Typography>
						<Typography>{user.name}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>Email</Typography>
						<Typography>{user.email}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>Role</Typography>
						<Typography>{user.role}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>Joined</Typography>
						<Typography>{new Date(user.createdAt).toLocaleDateString()}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>Purchased courses</Typography>
						<Typography>{user.purchasedCourses?.length ?? 0}</Typography>
					</Grid>
					{sub && (
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant='subtitle2' color='text.secondary'>Subscription</Typography>
							<Typography>
								{sub.plan} &bull;{' '}
								{new Date(sub.startDate).toLocaleDateString()} -{' '}
								{new Date(sub.endDate).toLocaleDateString()}
							</Typography>
						</Grid>
					)}
				</Grid>
			</Paper>

			{/* Cancel confirmation dialog */}
			<Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth='xs' fullWidth>
				<DialogTitle>Cancel Subscription</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to cancel your{' '}
						<strong>{sub?.plan}</strong> subscription? You will lose access to
						subscription-enrolled courses when it expires.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCancelOpen(false)} disabled={cancelling}>
						Keep It
					</Button>
					<Button
						variant='contained'
						color='error'
						disabled={cancelling}
						onClick={() => void handleCancel()}
					>
						{cancelling ? <CircularProgress size={18} color='inherit' /> : 'Cancel Subscription'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
