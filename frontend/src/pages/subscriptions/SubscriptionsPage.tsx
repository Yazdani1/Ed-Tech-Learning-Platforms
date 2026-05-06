import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	IconButton,
	MenuItem,
	Paper,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { subscriptionService } from '../../services/subscription.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { userService } from '../../services/user.service';
import type {
	ISubscription,
	ISubscriptionPlanConfig,
	IUser,
	SubscriptionPlan,
} from '../../types/index';
import { formatDate } from '../../utils/dateTime';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['Basic', 'Premium', 'Gold', 'Quiz Only'];

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
	Basic: '#0284c7',
	Premium: '#7c3aed',
	Gold: '#d97706',
	'Quiz Only': '#059669',
};

export default function SubscriptionsPage() {
	const { confirm } = useConfirmModal();
	const [activeTab, setActiveTab] = useState(0);

	// --- Plan Config state ---
	const [planConfigs, setPlanConfigs] = useState<ISubscriptionPlanConfig[]>([]);
	const [planLoading, setPlanLoading] = useState(true);
	const [planDialogOpen, setPlanDialogOpen] = useState(false);
	const [planForm, setPlanForm] = useState<{
		plan: SubscriptionPlan;
		price: string;
		duration: string;
		badge: string;
		color: string;
		features: string[];
	}>({
		plan: 'Basic',
		price: '',
		duration: '1',
		badge: '',
		color: '',
		features: [''],
	});
	const [planSaving, setPlanSaving] = useState(false);

	// --- Active Subscriptions state ---
	const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
	const [users, setUsers] = useState<IUser[]>([]);
	const [subsLoading, setSubsLoading] = useState(true);
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [assignForm, setAssignForm] = useState({
		userId: '',
		plan: 'Basic' as SubscriptionPlan,
		endDate: '',
	});
	const [assignSaving, setAssignSaving] = useState(false);

	useEffect(() => {
		loadPlanConfigs();
		loadSubscriptions();
	}, []);

	const loadPlanConfigs = () => {
		setPlanLoading(true);
		subscriptionPlanConfigService
			.getAll()
			.then((res) => setPlanConfigs(res.data ?? []))
			.finally(() => setPlanLoading(false));
	};

	const loadSubscriptions = () => {
		setSubsLoading(true);
		Promise.all([
			subscriptionService.getAll().then((res) => setSubscriptions(res.data ?? [])),
			userService.getAll().then((res) => setUsers(res.data ?? [])),
		]).finally(() => setSubsLoading(false));
	};

	// --- Plan Config handlers ---
	const handleOpenPlanDialog = (existing?: ISubscriptionPlanConfig) => {
		if (existing) {
			setPlanForm({
				plan: existing.plan,
				price: String(existing.price),
				duration: String(existing.duration),
				badge: existing.badge ?? '',
				color: existing.color ?? '',
				features: existing.features.length ? existing.features : [''],
			});
		} else {
			setPlanForm({ plan: 'Basic', price: '', duration: '1', badge: '', color: '', features: [''] });
		}
		setPlanDialogOpen(true);
	};

	const handleSavePlan = async () => {
		if (!planForm.plan || !planForm.price || !planForm.duration) {
			toast.error('Plan, price, and duration are required');
			return;
		}
		setPlanSaving(true);
		try {
			await subscriptionPlanConfigService.upsert({
				plan: planForm.plan,
				price: Number(planForm.price),
				duration: Number(planForm.duration),
				features: planForm.features.filter((f) => f.trim()),
				badge: planForm.badge || undefined,
				color: planForm.color || undefined,
			});
			toast.success('Plan card saved');
			loadPlanConfigs();
			setPlanDialogOpen(false);
		} catch {
			toast.error('Failed to save plan card');
		} finally {
			setPlanSaving(false);
		}
	};

	const handleDeletePlan = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Plan Card',
			message: 'Delete this plan card?',
			confirmText: 'Delete Plan',
			cancelText: 'Keep Plan',
		});
		if (!confirmed) return;
		try {
			await subscriptionPlanConfigService.delete(id);
			toast.success('Plan card deleted');
			loadPlanConfigs();
		} catch {
			toast.error('Failed to delete plan card');
		}
	};

	const handleFeatureChange = (index: number, value: string) => {
		setPlanForm((p) => {
			const updated = [...p.features];
			updated[index] = value;
			return { ...p, features: updated };
		});
	};

	const addFeature = () => setPlanForm((p) => ({ ...p, features: [...p.features, ''] }));
	const removeFeature = (i: number) =>
		setPlanForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

	// --- Subscription assign handlers ---
	const handleOpenAssignDialog = () => {
		setAssignForm({ userId: '', plan: 'Basic', endDate: '' });
		setAssignDialogOpen(true);
	};

	const handleAssign = async () => {
		if (!assignForm.userId || !assignForm.plan || !assignForm.endDate) {
			toast.error('All fields are required');
			return;
		}
		setAssignSaving(true);
		try {
			await subscriptionService.assign(assignForm);
			toast.success('Subscription assigned');
			loadSubscriptions();
			setAssignDialogOpen(false);
		} catch {
			toast.error('Failed to assign subscription');
		} finally {
			setAssignSaving(false);
		}
	};

	const handleCancel = async (id: string) => {
		const confirmed = await confirm({
			title: 'Cancel Subscription',
			message: 'Cancel this subscription?',
			confirmText: 'Cancel Subscription',
			cancelText: 'Keep Subscription',
		});
		if (!confirmed) return;
		try {
			await subscriptionService.cancel(id);
			toast.success('Subscription cancelled');
			loadSubscriptions();
		} catch {
			toast.error('Failed to cancel subscription');
		}
	};

	const getStatusColor = (status: string) => {
		if (status === 'Active') return 'success';
		if (status === 'Cancelled') return 'error';
		return 'warning';
	};

	const configuredPlans = new Set(planConfigs.map((c) => c.plan));

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 3 }}>
				Subscriptions
			</Typography>

			<Tabs
				value={activeTab}
				onChange={(_, v: number) => setActiveTab(v)}
				sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
			>
				<Tab label='Plan Cards' />
				<Tab label='Active Subscriptions' />
			</Tabs>

			{/* ── Tab 0: Plan Cards ─────────────────────────────────── */}
			{activeTab === 0 && (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
						<Typography variant='body1' color='text.secondary'>
							Create one card per subscription plan. Students will see these on the Pricing page.
						</Typography>
						<Button variant='contained' startIcon={<AddIcon />} onClick={() => handleOpenPlanDialog()}>
							Add Plan Card
						</Button>
					</Box>

					{planLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
							<CircularProgress />
						</Box>
					) : (
						<>
							{/* Configured plan cards */}
							<Grid container spacing={3}>
								{planConfigs.map((config) => {
									const accentColor = config.color || PLAN_COLORS[config.plan] || '#1976d2';
									return (
										<Grid key={config._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
											<Card
												elevation={0}
												sx={{
													border: '2px solid',
													borderColor: accentColor,
													borderRadius: 3,
													height: '100%',
													display: 'flex',
													flexDirection: 'column',
												}}
											>
												<CardContent sx={{ flex: 1 }}>
													<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
														<Typography variant='h6' sx={{ fontWeight: 700, color: accentColor }}>
															{config.plan}
														</Typography>
														{config.badge && (
															<Chip label={config.badge} size='small' sx={{ bgcolor: accentColor, color: 'white', fontWeight: 600 }} />
														)}
													</Box>
													<Typography variant='h4' sx={{ fontWeight: 800, mb: 0.25 }}>
														৳{config.price.toLocaleString()}
													</Typography>
													<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
														per {config.duration === 1 ? 'month' : `${config.duration} months`}
													</Typography>
													<Divider sx={{ mb: 1.5 }} />
													{config.features.map((f, i) => (
														<Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.75 }}>
															<CheckIcon sx={{ fontSize: 16, color: accentColor, mt: 0.2, flexShrink: 0 }} />
															<Typography variant='body2'>{f}</Typography>
														</Box>
													))}
												</CardContent>
												<CardActions sx={{ px: 2, pb: 2 }}>
													<Button
														size='small'
														startIcon={<EditIcon />}
														onClick={() => handleOpenPlanDialog(config)}
													>
														Edit
													</Button>
													<IconButton
														size='small'
														color='error'
														onClick={() => handleDeletePlan(config._id)}
													>
														<DeleteIcon fontSize='small' />
													</IconButton>
												</CardActions>
											</Card>
										</Grid>
									);
								})}
							</Grid>

							{/* Unconfigured plans hint */}
							{SUBSCRIPTION_PLANS.some((p) => !configuredPlans.has(p)) && (
								<Box sx={{ mt: 3 }}>
									<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
										Plans not yet configured:
									</Typography>
									<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
										{SUBSCRIPTION_PLANS.filter((p) => !configuredPlans.has(p)).map((p) => (
											<Chip
												key={p}
												label={p}
												variant='outlined'
												onClick={() => {
													setPlanForm({ plan: p, price: '', duration: '1', badge: '', color: '', features: [''] });
													setPlanDialogOpen(true);
												}}
												icon={<AddIcon />}
											/>
										))}
									</Box>
								</Box>
							)}
						</>
					)}
				</Box>
			)}

			{/* ── Tab 1: Active Subscriptions ──────────────────────── */}
			{activeTab === 1 && (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
						<Button variant='contained' startIcon={<AddIcon />} onClick={handleOpenAssignDialog}>
							Assign Subscription
						</Button>
					</Box>

					{subsLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
							<CircularProgress />
						</Box>
					) : (
						<TableContainer
							component={Paper}
							elevation={0}
							sx={{ border: '1px solid', borderColor: 'divider' }}
						>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 600 }}>User</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
										<TableCell sx={{ fontWeight: 600, width: 100 }}>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{subscriptions.map((sub) => (
										<TableRow key={sub._id}>
											<TableCell>{(sub.user as IUser).name}</TableCell>
											<TableCell>
												<Chip
													label={sub.plan}
													size='small'
													sx={{
														bgcolor: PLAN_COLORS[sub.plan] ?? '#1976d2',
														color: 'white',
														fontWeight: 600,
													}}
												/>
											</TableCell>
											<TableCell>
												<Chip label={sub.status} size='small' color={getStatusColor(sub.status)} />
											</TableCell>
											<TableCell>{formatDate(sub.startDate)}</TableCell>
											<TableCell>{formatDate(sub.endDate)}</TableCell>
											<TableCell>{(sub.assignedBy as IUser)?.name || 'Self'}</TableCell>
											<TableCell>
												{sub.status === 'Active' && (
													<IconButton
														size='small'
														color='error'
														onClick={() => handleCancel(sub._id)}
														title='Cancel Subscription'
													>
														<CancelIcon />
													</IconButton>
												)}
											</TableCell>
										</TableRow>
									))}
									{subscriptions.length === 0 && (
										<TableRow>
											<TableCell colSpan={7} align='center' sx={{ py: 4, color: 'text.secondary' }}>
												No subscriptions yet.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Box>
			)}

			{/* ── Plan Config Dialog ────────────────────────────────── */}
			<AppModal
				open={planDialogOpen}
				onClose={() => setPlanDialogOpen(false)}
				title='Subscription Plan Card'
				onSave={() => void handleSavePlan()}
				saving={planSaving}
				maxWidth='sm'
			>
					<TextField
						label='Plan'
						select
						value={planForm.plan}
						onChange={(e) => setPlanForm((p) => ({ ...p, plan: e.target.value as SubscriptionPlan }))}
						fullWidth
						sx={{ mt: 2 }}
						required
					>
						{SUBSCRIPTION_PLANS.map((plan) => (
							<MenuItem key={plan} value={plan}>
								{plan}
							</MenuItem>
						))}
					</TextField>

					<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
						<TextField
							label='Price (BDT)'
							type='number'
							value={planForm.price}
							onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))}
							fullWidth
							required
							slotProps={{ htmlInput: { min: 0 } }}
						/>
						<TextField
							label='Duration (months)'
							type='number'
							value={planForm.duration}
							onChange={(e) => setPlanForm((p) => ({ ...p, duration: e.target.value }))}
							fullWidth
							required
							slotProps={{ htmlInput: { min: 1 } }}
						/>
					</Box>

					<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
						<TextField
							label='Badge (e.g. Popular)'
							value={planForm.badge}
							onChange={(e) => setPlanForm((p) => ({ ...p, badge: e.target.value }))}
							fullWidth
						/>
						<TextField
							label='Card Color (hex)'
							value={planForm.color}
							onChange={(e) => setPlanForm((p) => ({ ...p, color: e.target.value }))}
							fullWidth
							placeholder='#7c3aed'
						/>
					</Box>

					<Typography variant='subtitle2' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
						Features
					</Typography>
					{planForm.features.map((feat, i) => (
						<Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
							<TextField
								value={feat}
								onChange={(e) => handleFeatureChange(i, e.target.value)}
								placeholder={`Feature ${i + 1}`}
								size='small'
								fullWidth
							/>
							<IconButton
								size='small'
								color='error'
								onClick={() => removeFeature(i)}
								disabled={planForm.features.length <= 1}
							>
								<CancelIcon fontSize='small' />
							</IconButton>
						</Box>
					))}
					<Button size='small' startIcon={<AddIcon />} onClick={addFeature} sx={{ mt: 0.5 }}>
						Add Feature
					</Button>
			</AppModal>

			{/* ── Assign Subscription Dialog ───────────────────────── */}
			<AppModal
				open={assignDialogOpen}
				onClose={() => setAssignDialogOpen(false)}
				title='Assign Subscription'
				onSave={() => void handleAssign()}
				saveText='Assign'
				saving={assignSaving}
				maxWidth='sm'
			>
					<TextField
						label='User'
						select
						value={assignForm.userId}
						onChange={(e) => setAssignForm((p) => ({ ...p, userId: e.target.value }))}
						fullWidth
						sx={{ mt: 2 }}
						required
					>
						{users.map((user) => (
							<MenuItem key={user._id} value={user._id}>
								{user.name} ({user.email})
							</MenuItem>
						))}
					</TextField>
					<TextField
						label='Plan'
						select
						value={assignForm.plan}
						onChange={(e) => setAssignForm((p) => ({ ...p, plan: e.target.value as SubscriptionPlan }))}
						fullWidth
						sx={{ mt: 2 }}
						required
					>
						{SUBSCRIPTION_PLANS.map((plan) => (
							<MenuItem key={plan} value={plan}>
								{plan}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label='End Date'
						type='date'
						value={assignForm.endDate}
						onChange={(e) => setAssignForm((p) => ({ ...p, endDate: e.target.value }))}
						fullWidth
						sx={{ mt: 2 }}
						slotProps={{ inputLabel: { shrink: true } }}
						required
					/>
			</AppModal>
		</Box>
	);
}
