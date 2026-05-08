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
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { subscriptionService } from '../../services/subscription.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { userService } from '../../services/user.service';
import type { ISubscription, ISubscriptionPlanConfig, IUser } from '../../types/index';
import { formatDate } from '../../utils/dateTime';

const PLAN_COLORS: Record<string, string> = {
	Basic: '#0284c7',
	Premium: '#7c3aed',
	Gold: '#d97706',
	'Quiz Only': '#059669',
};

const getBillingOptions = (plan: ISubscriptionPlanConfig) =>
	plan.billingOptions?.length
		? plan.billingOptions
		: [{ label: plan.duration === 1 ? 'Monthly' : `${plan.duration} months`, duration: plan.duration, price: plan.price }];

const blankBillingOption = () => ({ label: '', duration: '1', price: '' });
type MemberStatusFilter = 'active' | 'cancelled' | 'expired' | 'all';

const memberStatusTabs: Array<{ value: MemberStatusFilter; label: string }> = [
	{ value: 'active', label: 'Active Members' },
	{ value: 'cancelled', label: 'Cancelled' },
	{ value: 'expired', label: 'Expired' },
	{ value: 'all', label: 'All Records' },
];

export default function SubscriptionsPage() {
	const { confirm } = useConfirmModal();
	const [activeTab, setActiveTab] = useState(0);
	const [planConfigs, setPlanConfigs] = useState<ISubscriptionPlanConfig[]>([]);
	const [planLoading, setPlanLoading] = useState(true);
	const [planDialogOpen, setPlanDialogOpen] = useState(false);
	const [planSaving, setPlanSaving] = useState(false);
	const [planForm, setPlanForm] = useState({
		plan: '',
		billingOptions: [{ label: 'Monthly', duration: '1', price: '' }],
		badge: '',
		color: '',
		features: [''],
	});

	const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
	const [users, setUsers] = useState<IUser[]>([]);
	const [subsLoading, setSubsLoading] = useState(true);
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [assignSaving, setAssignSaving] = useState(false);
	const [assignForm, setAssignForm] = useState({
		userId: '',
		plan: '',
		billingDuration: '',
		endDate: '',
	});
	const [memberStatusTab, setMemberStatusTab] = useState<MemberStatusFilter>('active');
	const [memberFilters, setMemberFilters] = useState({
		search: '',
		plan: '',
		billingDuration: '',
	});

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

	const handleOpenPlanDialog = (existing?: ISubscriptionPlanConfig) => {
		if (existing) {
			setPlanForm({
				plan: existing.plan,
				billingOptions: getBillingOptions(existing).map((option) => ({
					label: option.label,
					duration: String(option.duration),
					price: String(option.price),
				})),
				badge: existing.badge ?? '',
				color: existing.color ?? '',
				features: existing.features.length ? existing.features : [''],
			});
		} else {
			setPlanForm({
				plan: '',
				billingOptions: [{ label: 'Monthly', duration: '1', price: '' }],
				badge: '',
				color: '',
				features: [''],
			});
		}
		setPlanDialogOpen(true);
	};

	const handleSavePlan = async () => {
		const billingOptions = planForm.billingOptions
			.map((option) => ({
				label: option.label.trim(),
				duration: Number(option.duration),
				price: Number(option.price),
			}))
			.filter((option) => option.label && option.duration > 0 && option.price >= 0);

		if (!planForm.plan.trim() || billingOptions.length === 0) {
			toast.error('Plan name and at least one billing option are required');
			return;
		}

		setPlanSaving(true);
		try {
			await subscriptionPlanConfigService.upsert({
				plan: planForm.plan.trim(),
				billingOptions,
				features: planForm.features.filter((f) => f.trim()),
				badge: planForm.badge || undefined,
				color: planForm.color || undefined,
			});
			toast.success('Plan saved');
			loadPlanConfigs();
			setPlanDialogOpen(false);
		} catch {
			toast.error('Failed to save plan');
		} finally {
			setPlanSaving(false);
		}
	};

	const handleDeletePlan = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Plan',
			message: 'Delete this subscription plan?',
			confirmText: 'Delete Plan',
			cancelText: 'Keep Plan',
		});
		if (!confirmed) return;
		try {
			await subscriptionPlanConfigService.delete(id);
			toast.success('Plan deleted');
			loadPlanConfigs();
		} catch {
			toast.error('Failed to delete plan');
		}
	};

	const handleBillingOptionChange = (index: number, field: 'label' | 'duration' | 'price', value: string) => {
		setPlanForm((p) => {
			const updated = [...p.billingOptions];
			updated[index] = { ...updated[index], [field]: value };
			return { ...p, billingOptions: updated };
		});
	};

	const addBillingOption = () =>
		setPlanForm((p) => ({ ...p, billingOptions: [...p.billingOptions, blankBillingOption()] }));
	const removeBillingOption = (index: number) =>
		setPlanForm((p) => ({ ...p, billingOptions: p.billingOptions.filter((_, idx) => idx !== index) }));
	const handleFeatureChange = (index: number, value: string) =>
		setPlanForm((p) => {
			const updated = [...p.features];
			updated[index] = value;
			return { ...p, features: updated };
		});
	const addFeature = () => setPlanForm((p) => ({ ...p, features: [...p.features, ''] }));
	const removeFeature = (i: number) =>
		setPlanForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

	const handleOpenAssignDialog = () => {
		const firstPlan = planConfigs[0];
		const firstOption = firstPlan ? getBillingOptions(firstPlan)[0] : null;
		setAssignForm({
			userId: '',
			plan: firstPlan?.plan ?? '',
			billingDuration: firstOption ? String(firstOption.duration) : '',
			endDate: '',
		});
		setAssignDialogOpen(true);
	};

	const handleAssignPlanChange = (planName: string) => {
		const plan = planConfigs.find((config) => config.plan === planName);
		const firstOption = plan ? getBillingOptions(plan)[0] : null;
		setAssignForm((p) => ({
			...p,
			plan: planName,
			billingDuration: firstOption ? String(firstOption.duration) : '',
		}));
	};

	const handleAssign = async () => {
		if (!assignForm.userId || !assignForm.plan || !assignForm.billingDuration || !assignForm.endDate) {
			toast.error('All fields are required');
			return;
		}
		setAssignSaving(true);
		try {
			await subscriptionService.assign({
				...assignForm,
				billingDuration: Number(assignForm.billingDuration),
			});
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

	const selectedAssignPlan = planConfigs.find((plan) => plan.plan === assignForm.plan);
	const selectedAssignOptions = selectedAssignPlan ? getBillingOptions(selectedAssignPlan) : [];
	const planFilterOptions = planConfigs.map((plan) => plan.plan);
	const billingFilterOptions = Array.from(
		new Map(
			planConfigs
				.flatMap((plan) => getBillingOptions(plan))
				.map((option) => [option.duration, option.label || `${option.duration} months`]),
		).entries(),
	)
		.map(([duration, label]) => ({ duration, label }))
		.sort((a, b) => a.duration - b.duration);

	const getEffectiveStatus = (sub: ISubscription): 'Active' | 'Expired' | 'Cancelled' => {
		if (sub.status === 'Cancelled') return 'Cancelled';
		if (sub.status === 'Expired' || new Date(sub.endDate) <= new Date()) return 'Expired';
		return 'Active';
	};

	const subscriptionRows = subscriptions.map((sub) => ({
		...sub,
		effectiveStatus: getEffectiveStatus(sub),
	}));

	const statusCounts = subscriptionRows.reduce(
		(acc, sub) => {
			if (sub.effectiveStatus === 'Active') acc.active += 1;
			if (sub.effectiveStatus === 'Cancelled') acc.cancelled += 1;
			if (sub.effectiveStatus === 'Expired') acc.expired += 1;
			acc.all += 1;
			return acc;
		},
		{ active: 0, cancelled: 0, expired: 0, all: 0 },
	);

	const filteredSubscriptions = subscriptionRows.filter((sub) => {
		const user = sub.user as IUser;
		const haystack = `${user?.name ?? ''} ${user?.email ?? ''} ${sub.plan}`.toLowerCase();
		const matchesSearch = !memberFilters.search.trim() || haystack.includes(memberFilters.search.trim().toLowerCase());
		const matchesPlan = !memberFilters.plan || sub.plan === memberFilters.plan;
		const matchesBilling = !memberFilters.billingDuration || String(sub.billingDuration ?? '') === memberFilters.billingDuration;
		const matchesStatus =
			memberStatusTab === 'all' ||
			(memberStatusTab === 'active' && sub.effectiveStatus === 'Active') ||
			(memberStatusTab === 'cancelled' && sub.effectiveStatus === 'Cancelled') ||
			(memberStatusTab === 'expired' && sub.effectiveStatus === 'Expired');

		return matchesSearch && matchesPlan && matchesBilling && matchesStatus;
	});

	const clearMemberFilters = () => {
		setMemberFilters({ search: '', plan: '', billingDuration: '' });
	};

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 3 }}>
				Subscriptions
			</Typography>

			<Tabs value={activeTab} onChange={(_, v: number) => setActiveTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
				<Tab label='Plans' />
				<Tab label='Subscription Members' />
			</Tabs>

			{activeTab === 0 && (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
						<Typography variant='body1' color='text.secondary'>
							Create subscription plans and add dynamic billing options for monthly, 3 months, 6 months, yearly, or any duration.
						</Typography>
						<Button variant='contained' startIcon={<AddIcon />} onClick={() => handleOpenPlanDialog()}>
							Add Plan
						</Button>
					</Box>

					{planLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
							<CircularProgress />
						</Box>
					) : (
						<Grid container spacing={3}>
							{planConfigs.map((config) => {
								const accentColor = config.color || PLAN_COLORS[config.plan] || '#1976d2';
								const billingOptions = getBillingOptions(config);
								return (
									<Grid key={config._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<Card elevation={0} sx={{ border: '2px solid', borderColor: accentColor, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
											<CardContent sx={{ flex: 1 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
													<Typography variant='h6' sx={{ fontWeight: 700, color: accentColor }}>
														{config.plan}
													</Typography>
													{config.badge && <Chip label={config.badge} size='small' sx={{ bgcolor: accentColor, color: 'white', fontWeight: 600 }} />}
												</Box>
												<Box sx={{ mb: 2 }}>
													{billingOptions.map((option) => (
														<Typography key={`${config._id}-${option.duration}`} variant='body2'>
															<strong>{option.label}:</strong> BDT {option.price.toLocaleString()} / {option.duration === 1 ? 'month' : `${option.duration} months`}
														</Typography>
													))}
												</Box>
												<Divider sx={{ mb: 1.5 }} />
												{config.features.map((f, i) => (
													<Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.75 }}>
														<CheckIcon sx={{ fontSize: 16, color: accentColor, mt: 0.2, flexShrink: 0 }} />
														<Typography variant='body2'>{f}</Typography>
													</Box>
												))}
											</CardContent>
											<CardActions sx={{ px: 2, pb: 2 }}>
												<Button size='small' startIcon={<EditIcon />} onClick={() => handleOpenPlanDialog(config)}>
													Edit
												</Button>
												<IconButton size='small' color='error' onClick={() => handleDeletePlan(config._id)}>
													<DeleteIcon fontSize='small' />
												</IconButton>
											</CardActions>
										</Card>
									</Grid>
								);
							})}
						</Grid>
					)}
				</Box>
			)}

			{activeTab === 1 && (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
						<Box>
							<Typography variant='h6' sx={{ fontWeight: 800 }}>
								Subscription Members
							</Typography>
							<Typography variant='body2' color='text.secondary'>
								Review active members, cancelled records, expired access, and plan-based user lists.
							</Typography>
						</Box>
						<Button variant='contained' startIcon={<AddIcon />} onClick={handleOpenAssignDialog} disabled={planConfigs.length === 0}>
							Assign Subscription
						</Button>
					</Box>

					<Tabs
						value={memberStatusTab}
						onChange={(_, value: MemberStatusFilter) => setMemberStatusTab(value)}
						sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
					>
						{memberStatusTabs.map((tab) => (
							<Tab
								key={tab.value}
								value={tab.value}
								label={`${tab.label} (${statusCounts[tab.value]})`}
							/>
						))}
					</Tabs>

					<Paper
						elevation={0}
						sx={{
							p: 2,
							mb: 2.5,
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: 2,
						}}
					>
						<Grid container spacing={2} sx={{ alignItems: 'center' }}>
							<Grid size={{ xs: 12, md: 4 }}>
								<TextField
									label='Search members'
									value={memberFilters.search}
									onChange={(e) => setMemberFilters((current) => ({ ...current, search: e.target.value }))}
									fullWidth
									size='small'
									placeholder='Name, email, or plan'
									slotProps={{
										input: {
											startAdornment: <SearchIcon fontSize='small' sx={{ color: 'text.secondary', mr: 1 }} />,
										},
									}}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<TextField
									label='Subscription plan'
									select
									value={memberFilters.plan}
									onChange={(e) => setMemberFilters((current) => ({ ...current, plan: e.target.value }))}
									fullWidth
									size='small'
								>
									<MenuItem value=''>All plans</MenuItem>
									{planFilterOptions.map((plan) => (
										<MenuItem key={plan} value={plan}>
											{plan}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<TextField
									label='Billing duration'
									select
									value={memberFilters.billingDuration}
									onChange={(e) => setMemberFilters((current) => ({ ...current, billingDuration: e.target.value }))}
									fullWidth
									size='small'
								>
									<MenuItem value=''>All durations</MenuItem>
									{billingFilterOptions.map((option) => (
										<MenuItem key={option.duration} value={String(option.duration)}>
											{option.label}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid size={{ xs: 12, md: 2 }}>
								<Button fullWidth variant='outlined' onClick={clearMemberFilters} sx={{ fontWeight: 800 }}>
									Clear
								</Button>
							</Grid>
						</Grid>
					</Paper>

					{subsLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
							<CircularProgress />
						</Box>
					) : (
						<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 600 }}>User</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Billing</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
										<TableCell sx={{ fontWeight: 600, width: 100 }}>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredSubscriptions.map((sub) => (
										<TableRow key={sub._id}>
											<TableCell>
												<Typography variant='body2' sx={{ fontWeight: 800 }}>
													{(sub.user as IUser).name}
												</Typography>
												<Typography variant='caption' color='text.secondary'>
													{(sub.user as IUser).email}
												</Typography>
											</TableCell>
											<TableCell>
												<Chip label={sub.plan} size='small' sx={{ bgcolor: PLAN_COLORS[sub.plan] ?? '#1976d2', color: 'white', fontWeight: 600 }} />
											</TableCell>
											<TableCell>{sub.billingLabel ?? (sub.billingDuration ? `${sub.billingDuration} months` : '-')}</TableCell>
											<TableCell>{sub.pricePaid !== undefined ? `BDT ${sub.pricePaid.toLocaleString()}` : '-'}</TableCell>
											<TableCell>
												<Chip label={sub.effectiveStatus} size='small' color={getStatusColor(sub.effectiveStatus)} />
											</TableCell>
											<TableCell>{formatDate(sub.startDate)}</TableCell>
											<TableCell>{formatDate(sub.endDate)}</TableCell>
											<TableCell>{(sub.assignedBy as IUser)?.name || 'Self'}</TableCell>
											<TableCell>
												{sub.status === 'Active' && (
													<IconButton size='small' color='error' onClick={() => handleCancel(sub._id)} title='Cancel Subscription'>
														<CancelIcon />
													</IconButton>
												)}
											</TableCell>
										</TableRow>
									))}
									{filteredSubscriptions.length === 0 && (
										<TableRow>
											<TableCell colSpan={9} align='center' sx={{ py: 4, color: 'text.secondary' }}>
												No subscriptions match this view.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Box>
			)}

			<AppModal open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} title='Subscription Plan' onSave={() => void handleSavePlan()} saving={planSaving} maxWidth='sm'>
				<TextField
					label='Plan name'
					value={planForm.plan}
					onChange={(e) => setPlanForm((p) => ({ ...p, plan: e.target.value }))}
					fullWidth
					sx={{ mt: 2 }}
					required
					placeholder='Premium'
				/>

				<Typography variant='subtitle2' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
					Billing Options
				</Typography>
				{planForm.billingOptions.map((option, i) => (
					<Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 0.8fr 1fr auto' }, gap: 1, mb: 1 }}>
						<TextField label='Label' value={option.label} onChange={(e) => handleBillingOptionChange(i, 'label', e.target.value)} size='small' placeholder='Monthly' />
						<TextField label='Months' type='number' value={option.duration} onChange={(e) => handleBillingOptionChange(i, 'duration', e.target.value)} size='small' slotProps={{ htmlInput: { min: 1 } }} />
						<TextField label='Price (BDT)' type='number' value={option.price} onChange={(e) => handleBillingOptionChange(i, 'price', e.target.value)} size='small' slotProps={{ htmlInput: { min: 0 } }} />
						<IconButton size='small' color='error' onClick={() => removeBillingOption(i)} disabled={planForm.billingOptions.length <= 1}>
							<CancelIcon fontSize='small' />
						</IconButton>
					</Box>
				))}
				<Button size='small' startIcon={<AddIcon />} onClick={addBillingOption} sx={{ mt: 0.5 }}>
					Add Billing Option
				</Button>

				<Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
					<TextField label='Badge (e.g. Popular)' value={planForm.badge} onChange={(e) => setPlanForm((p) => ({ ...p, badge: e.target.value }))} fullWidth />
					<TextField label='Card Color (hex)' value={planForm.color} onChange={(e) => setPlanForm((p) => ({ ...p, color: e.target.value }))} fullWidth placeholder='#7c3aed' />
				</Box>

				<Typography variant='subtitle2' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
					Features
				</Typography>
				{planForm.features.map((feat, i) => (
					<Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
						<TextField value={feat} onChange={(e) => handleFeatureChange(i, e.target.value)} placeholder={`Feature ${i + 1}`} size='small' fullWidth />
						<IconButton size='small' color='error' onClick={() => removeFeature(i)} disabled={planForm.features.length <= 1}>
							<CancelIcon fontSize='small' />
						</IconButton>
					</Box>
				))}
				<Button size='small' startIcon={<AddIcon />} onClick={addFeature} sx={{ mt: 0.5 }}>
					Add Feature
				</Button>
			</AppModal>

			<AppModal open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} title='Assign Subscription' onSave={() => void handleAssign()} saveText='Assign' saving={assignSaving} maxWidth='sm'>
				<TextField label='User' select value={assignForm.userId} onChange={(e) => setAssignForm((p) => ({ ...p, userId: e.target.value }))} fullWidth sx={{ mt: 2 }} required>
					{users.map((user) => (
						<MenuItem key={user._id} value={user._id}>
							{user.name} ({user.email})
						</MenuItem>
					))}
				</TextField>
				<TextField label='Plan' select value={assignForm.plan} onChange={(e) => handleAssignPlanChange(e.target.value)} fullWidth sx={{ mt: 2 }} required>
					{planConfigs.map((plan) => (
						<MenuItem key={plan._id} value={plan.plan}>
							{plan.plan}
						</MenuItem>
					))}
				</TextField>
				<TextField label='Billing option' select value={assignForm.billingDuration} onChange={(e) => setAssignForm((p) => ({ ...p, billingDuration: e.target.value }))} fullWidth sx={{ mt: 2 }} required>
					{selectedAssignOptions.map((option) => (
						<MenuItem key={option.duration} value={String(option.duration)}>
							{option.label} - BDT {option.price.toLocaleString()}
						</MenuItem>
					))}
				</TextField>
				<TextField label='End Date' type='date' value={assignForm.endDate} onChange={(e) => setAssignForm((p) => ({ ...p, endDate: e.target.value }))} fullWidth sx={{ mt: 2 }} slotProps={{ inputLabel: { shrink: true } }} required />
			</AppModal>
		</Box>
	);
}
