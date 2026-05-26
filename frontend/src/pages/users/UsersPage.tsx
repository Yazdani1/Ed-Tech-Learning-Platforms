import { type FC, type ReactNode, useEffect, useState } from 'react';
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	FormControl,
	Grid,
	InputAdornment,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Skeleton,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import AppPagination from '../../components/common/AppPagination';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useAuth } from '../../context/useAuth';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { userService } from '../../services/user.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import type { IPaginationMeta, IUser } from '../../types/index';
import { formatDateTime } from '../../utils/dateTime';

const USER_ROLES: IUser['role'][] = [
	'Super Admin',
	'Admin',
	'Moderator',
	'Teacher',
	'Student',
];

const DEFAULT_FORM = { name: '', email: '', password: '', role: 'Student' as IUser['role'] };
const USERS_PAGE_SIZE = 10;
const USER_CARD_SKELETONS = Array.from({ length: USERS_PAGE_SIZE });
type SubscriptionStatusFilter = '' | 'active' | 'expired' | 'inactive';
type EnrollmentFilter = '' | 'has_total' | 'none_total' | 'has_free' | 'none_free' | 'has_paid' | 'none_paid' | 'has_subscription' | 'none_subscription';
type SpendingFilter = '' | 'has_total' | 'none_total' | 'has_paid_course' | 'none_paid_course' | 'has_subscription' | 'none_subscription';

const ENROLLMENT_FILTERS: { label: string; value: EnrollmentFilter }[] = [
	{ label: 'All enrollment activity', value: '' },
	{ label: 'Has any enrollment', value: 'has_total' },
	{ label: 'No enrollments', value: 'none_total' },
	{ label: 'Has free courses', value: 'has_free' },
	{ label: 'No free courses', value: 'none_free' },
	{ label: 'Has paid purchases', value: 'has_paid' },
	{ label: 'No paid purchases', value: 'none_paid' },
	{ label: 'Has subscription courses', value: 'has_subscription' },
	{ label: 'No subscription courses', value: 'none_subscription' },
];

const SPENDING_FILTERS: { label: string; value: SpendingFilter }[] = [
	{ label: 'All spending activity', value: '' },
	{ label: 'Has any spend', value: 'has_total' },
	{ label: 'No spend', value: 'none_total' },
	{ label: 'Spent on paid courses', value: 'has_paid_course' },
	{ label: 'No paid course spend', value: 'none_paid_course' },
	{ label: 'Spent on subscriptions', value: 'has_subscription' },
	{ label: 'No subscription spend', value: 'none_subscription' },
];

const DEFAULT_FILTERS = {
	search: '',
	role: '' as '' | IUser['role'],
	subscriptionPlan: '',
	subscriptionStatus: '' as SubscriptionStatusFilter,
	enrollmentFilter: '' as EnrollmentFilter,
	spendingFilter: '' as SpendingFilter,
	minTotalSpent: '',
	maxTotalSpent: '',
	minPaidCourseSpend: '',
	maxPaidCourseSpend: '',
	minSubscriptionSpend: '',
	maxSubscriptionSpend: '',
};

const roleChipColor: Partial<Record<IUser['role'], 'primary' | 'secondary' | 'success' | 'warning' | 'info'>> = {
	'Super Admin': 'secondary',
	Admin: 'primary',
	Moderator: 'warning',
	Teacher: 'info',
	Student: 'success',
};

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join('') || 'U';

const getEnrollmentSummary = (user: IUser) => ({
	free: user.enrollmentSummary?.free ?? 0,
	paid: user.enrollmentSummary?.paid ?? user.purchasedCourses?.length ?? 0,
	subscription: user.enrollmentSummary?.subscription ?? 0,
	total: user.enrollmentSummary?.total ?? user.purchasedCourses?.length ?? 0,
});

const getSpendingSummary = (user: IUser) => ({
	paidCourses: user.spendingSummary?.paidCourses ?? 0,
	subscriptions: user.spendingSummary?.subscriptions ?? 0,
	total: user.spendingSummary?.total ?? 0,
});

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	}).format(amount);

const getSubscriptionStatus = (user: IUser) => {
	const endDate = user.activeSubscription?.endDate;
	if (!endDate) return 'Inactive';
	return new Date(endDate) > new Date() ? 'Active' : 'Expired';
};

interface DetailItemProps {
	label: string;
	value: ReactNode;
}

const DetailItem: FC<DetailItemProps> = ({ label, value }) => {
	return (
		<Box
			sx={{
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				px: 1.5,
				py: 1.25,
				minWidth: 0,
			}}
		>
			<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 750 }}>
				{label}
			</Typography>
			<Box
				sx={{
					mt: 0.5,
					fontSize: '0.925rem',
					fontWeight: 650,
					color: 'text.primary',
					overflowWrap: 'anywhere',
				}}
			>
				{value}
			</Box>
		</Box>
	);
}

const UserCardSkeleton= () => {
	return (
		<Card
			elevation={0}
			sx={{
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				height: '100%',
			}}
		>
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: 'minmax(0, 1fr) auto',
							sm: 'minmax(0, 1.25fr) minmax(120px, 0.55fr) minmax(130px, 0.65fr) auto',
						},
						alignItems: 'center',
						columnGap: 2,
						rowGap: 1.5,
					}}
				>
					<Box sx={{ minWidth: 0 }}>
						<Skeleton animation='wave' variant='text' sx={{ fontSize: '1.1rem', width: '78%' }} />
						<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.875rem', width: '92%', mt: 0.35 }} />
					</Box>

					<Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.875rem', width: 34 }} />
							<Skeleton animation='wave' variant='rounded' width={82} height={24} sx={{ borderRadius: 1 }} />
						</Box>
					</Box>

					<Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
						<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.9rem', width: '88%' }} />
					</Box>

					<Box sx={{ justifySelf: 'end', gridColumn: { xs: '2', sm: 'auto' }, gridRow: { xs: '1', sm: 'auto' } }}>
						<Skeleton animation='wave' variant='rounded' width={34} height={34} sx={{ borderRadius: 1 }} />
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
}

const UsersPage= () => {
	const { user: currentUser } = useAuth();
	const { confirm } = useConfirmModal();
	const [users, setUsers] = useState<IUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<IUser | null>(null);
	const [detailsUser, setDetailsUser] = useState<IUser | null>(null);
	const [form, setForm] = useState(DEFAULT_FORM);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<IPaginationMeta | null>(null);
	const [totalUsers, setTotalUsers] = useState(0);
	const [resultCount, setResultCount] = useState(0);
	const [saving, setSaving] = useState(false);
	const [subscriptionPlans, setSubscriptionPlans] = useState<string[]>([]);
	const isSuperAdmin = currentUser?.role === 'Super Admin';

	useEffect(() => {
		if (!isSuperAdmin) return;
		subscriptionPlanConfigService
			.getAll()
			.then((res) => setSubscriptionPlans((res.data ?? []).map((plan) => plan.plan)))
			.catch(() => setSubscriptionPlans([]));
	}, [isSuperAdmin]);

	useEffect(() => {
		loadUsers();
	}, [filters, isSuperAdmin, page]);

	const loadUsers = () => {
		const params: Record<string, string> = {
			page: String(page),
			limit: String(USERS_PAGE_SIZE),
		};
		if (filters.search.trim()) params.search = filters.search.trim();
		if (filters.role) params.role = filters.role;
		if (isSuperAdmin) {
			if (filters.subscriptionPlan) params.subscriptionPlan = filters.subscriptionPlan;
			if (filters.subscriptionStatus) params.subscriptionStatus = filters.subscriptionStatus;
			if (filters.enrollmentFilter) params.enrollmentFilter = filters.enrollmentFilter;
			if (filters.spendingFilter) params.spendingFilter = filters.spendingFilter;
			if (filters.minTotalSpent) params.minTotalSpent = filters.minTotalSpent;
			if (filters.maxTotalSpent) params.maxTotalSpent = filters.maxTotalSpent;
			if (filters.minPaidCourseSpend) params.minPaidCourseSpend = filters.minPaidCourseSpend;
			if (filters.maxPaidCourseSpend) params.maxPaidCourseSpend = filters.maxPaidCourseSpend;
			if (filters.minSubscriptionSpend) params.minSubscriptionSpend = filters.minSubscriptionSpend;
			if (filters.maxSubscriptionSpend) params.maxSubscriptionSpend = filters.maxSubscriptionSpend;
		}

		setLoading(true);
		userService
			.getAll(params)
			.then((res) => {
				const data = res.data ?? [];
				const total = res.total ?? data.length;
				const fallbackPagination =
					total > USERS_PAGE_SIZE
						? {
								page,
								limit: USERS_PAGE_SIZE,
								total,
								totalPages: Math.max(Math.ceil(total / USERS_PAGE_SIZE), 1),
								hasNextPage: page < Math.ceil(total / USERS_PAGE_SIZE),
								hasPrevPage: page > 1,
							}
						: null;
				const nextPagination = res.pagination ?? fallbackPagination;

				setUsers(res.pagination ? data : data.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE));
				setResultCount(total);
				setTotalUsers(res.totalUsers ?? total);
				setPagination(nextPagination);
				if (nextPagination?.page && nextPagination.page !== page) {
					setPage(nextPagination.page);
				}
			})
			.finally(() => setLoading(false));
	};

	const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
		if (!isSuperAdmin && !['search', 'role'].includes(key)) return false;
		return Boolean(value);
	}).length;
	const hasFilters = activeFilterCount > 0;

	const clearFilters = () => {
		setPage(1);
		setFilters(DEFAULT_FILTERS);
		setFiltersOpen(false);
	};

	const updateFilters = (patch: Partial<typeof DEFAULT_FILTERS>) => {
		setPage(1);
		setFilters((prev) => ({ ...prev, ...patch }));
	};

	const openCreateDialog = () => {
		setEditingUser(null);
		setForm(DEFAULT_FORM);
		setDialogOpen(true);
	};

	const openEditDialog = (selectedUser: IUser) => {
		setEditingUser(selectedUser);
		setForm({
			name: selectedUser.name,
			email: selectedUser.email,
			password: '',
			role: selectedUser.role,
		});
		setDialogOpen(true);
	};

	const openDetailsDialog = (selectedUser: IUser) => {
		setDetailsUser(selectedUser);
	};

	const closeDetailsDialog = () => {
		setDetailsUser(null);
	};

	const closeDialog = () => {
		setDialogOpen(false);
		setEditingUser(null);
		setForm(DEFAULT_FORM);
	};

	const handleSave = async () => {
		if (!form.name.trim() || !form.email.trim() || (!editingUser && !form.password.trim())) {
			toast.error(
				editingUser
					? 'Name and email are required'
					: 'Name, email and password are required',
			);
			return;
		}

		setSaving(true);
		try {
			if (editingUser) {
				const payload = {
					name: form.name,
					email: form.email,
					role: form.role,
					...(form.password.trim() ? { password: form.password } : {}),
				};
				await userService.update(editingUser._id, payload);
				toast.success('User updated');
			} else {
				await userService.create(form);
				toast.success('User created');
			}
			closeDialog();
			loadUsers();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to save user';
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete User',
			message: 'Are you sure you want to delete this user?',
			confirmText: 'Delete User',
			cancelText: 'Keep User',
		});
		if (!confirmed) return;
		try {
			await userService.delete(id);
			toast.success('User deleted');
			loadUsers();
		} catch {
			toast.error('Failed to delete user');
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					User List
				</Typography>
				<Button variant='contained' startIcon={<AddIcon />} onClick={openCreateDialog}>
					Create User
				</Button>
			</Box>

			<Paper
				variant='outlined'
				sx={{
					p: 2,
					borderRadius: 1,
					mb: 3,
					bgcolor: 'background.paper',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: filtersOpen ? 2 : 0 }}>
					<Box>
						<Typography variant='subtitle1' sx={{ fontWeight: 900 }}>
							Filter users
						</Typography>
						<Typography variant='body2' color='text.secondary'>
							{loading
								? 'Loading users...'
								: `${resultCount} of ${totalUsers} user${totalUsers !== 1 ? 's' : ''}${hasFilters ? ' match your filters' : ' available'}`}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
						<Chip
							label={`${totalUsers} total`}
							size='small'
							sx={{ fontWeight: 800 }}
						/>
						<Chip
							label={`${resultCount} result${resultCount !== 1 ? 's' : ''}`}
							size='small'
							color={hasFilters ? 'primary' : 'default'}
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
						{hasFilters && (
							<Button size='small' onClick={clearFilters}>
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
										transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
										transition: 'transform 0.2s ease',
									}}
								/>
							}
							onClick={() => setFiltersOpen((prev) => !prev)}
						>
							{filtersOpen ? 'Hide filters' : 'Show filters'}
						</Button>
					</Box>
				</Box>

				<Box
					sx={{
						display: filtersOpen ? 'block' : 'none',
						pt: 2,
						borderTop: '1px solid',
						borderColor: 'divider',
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
							<TextField
								placeholder='Search name or email...'
								value={filters.search}
								onChange={(e) => updateFilters({ search: e.target.value })}
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
						<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
							<FormControl size='small' fullWidth>
								<InputLabel>Role</InputLabel>
								<Select
									label='Role'
									value={filters.role}
									onChange={(e) => updateFilters({ role: e.target.value as '' | IUser['role'] })}
								>
									<MenuItem value=''>All roles</MenuItem>
									{USER_ROLES.map((role) => (
										<MenuItem key={role} value={role}>
											{role}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						{isSuperAdmin && (
							<>
								<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
									<FormControl size='small' fullWidth>
										<InputLabel>Subscription Plan</InputLabel>
										<Select
											label='Subscription Plan'
											value={filters.subscriptionPlan}
											onChange={(e) => updateFilters({ subscriptionPlan: e.target.value })}
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
								<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
									<FormControl size='small' fullWidth>
										<InputLabel>Subscription Status</InputLabel>
										<Select
											label='Subscription Status'
											value={filters.subscriptionStatus}
											onChange={(e) => updateFilters({ subscriptionStatus: e.target.value as SubscriptionStatusFilter })}
										>
											<MenuItem value=''>All statuses</MenuItem>
											<MenuItem value='active'>Active</MenuItem>
											<MenuItem value='expired'>Expired</MenuItem>
											<MenuItem value='inactive'>Inactive</MenuItem>
										</Select>
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
									<FormControl size='small' fullWidth>
										<InputLabel>Enrollment Activity</InputLabel>
										<Select
											label='Enrollment Activity'
											value={filters.enrollmentFilter}
											onChange={(e) => updateFilters({ enrollmentFilter: e.target.value as EnrollmentFilter })}
										>
											{ENROLLMENT_FILTERS.map((option) => (
												<MenuItem key={option.value || 'all'} value={option.value}>
													{option.label}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
									<FormControl size='small' fullWidth>
										<InputLabel>Spending Activity</InputLabel>
										<Select
											label='Spending Activity'
											value={filters.spendingFilter}
											onChange={(e) => updateFilters({ spendingFilter: e.target.value as SpendingFilter })}
										>
											{SPENDING_FILTERS.map((option) => (
												<MenuItem key={option.value || 'all'} value={option.value}>
													{option.label}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 2 }}>
									<TextField
										label='Min total spend'
										type='number'
										size='small'
										fullWidth
										value={filters.minTotalSpent}
										onChange={(e) => updateFilters({ minTotalSpent: e.target.value })}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 2 }}>
									<TextField
										label='Max total spend'
										type='number'
										size='small'
										fullWidth
										value={filters.maxTotalSpent}
										onChange={(e) => updateFilters({ maxTotalSpent: e.target.value })}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 2 }}>
									<TextField
										label='Min paid spend'
										type='number'
										size='small'
										fullWidth
										value={filters.minPaidCourseSpend}
										onChange={(e) => updateFilters({ minPaidCourseSpend: e.target.value })}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 2 }}>
									<TextField
										label='Max paid spend'
										type='number'
										size='small'
										fullWidth
										value={filters.maxPaidCourseSpend}
										onChange={(e) => updateFilters({ maxPaidCourseSpend: e.target.value })}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 2 }}>
									<TextField
										label='Min sub spend'
										type='number'
										size='small'
										fullWidth
										value={filters.minSubscriptionSpend}
										onChange={(e) => updateFilters({ minSubscriptionSpend: e.target.value })}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, lg: 2 }}>
									<TextField
										label='Max sub spend'
										type='number'
										size='small'
										fullWidth
										value={filters.maxSubscriptionSpend}
										onChange={(e) => updateFilters({ maxSubscriptionSpend: e.target.value })}
									/>
								</Grid>
							</>
						)}
					</Grid>
				</Box>
			</Paper>

			{loading ? (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
						gap: 2.5,
					}}
				>
					{USER_CARD_SKELETONS.map((_, index) => (
						<UserCardSkeleton key={index} />
					))}
				</Box>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
						gap: 2.5,
					}}
				>
					{users.length === 0 ? (
						<Box
							sx={{
								gridColumn: '1 / -1',
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1,
								py: 8,
								textAlign: 'center',
								color: 'text.secondary',
								bgcolor: 'background.paper',
							}}
						>
							No users yet.
						</Box>
					) : (
						users.map((user) => (
							<Card
								key={user._id}
								elevation={0}
								sx={{
									border: '1px solid',
									borderColor: 'divider',
									borderRadius: 1,
									height: '100%',
									transition: 'border-color 160ms ease, box-shadow 160ms ease',
									'&:hover': {
										borderColor: 'primary.light',
										boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
									},
								}}
							>
								<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: {
												xs: 'minmax(0, 1fr) auto',
												sm: 'minmax(0, 1.25fr) minmax(120px, 0.55fr) minmax(130px, 0.65fr) auto',
											},
											alignItems: 'center',
											columnGap: 2,
											rowGap: 1.5,
										}}
									>
										<Box sx={{ minWidth: 0 }}>
											<Typography
												variant='subtitle1'
												sx={{
													fontWeight: 800,
													lineHeight: 1.25,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												<Box component='span' sx={{ color: 'text.secondary', fontWeight: 700 }}>
													Name:{' '}
												</Box>
												{user.name}
											</Typography>
											<Typography
												variant='body2'
												color='text.secondary'
												sx={{ overflowWrap: 'anywhere', mt: 0.35 }}
											>
												<Box component='span' sx={{ fontWeight: 700 }}>
													Email:{' '}
												</Box>
												{user.email}
											</Typography>
										</Box>

										<Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
												<Typography variant='body2' color='text.secondary' sx={{ fontWeight: 700 }}>
													Role:
												</Typography>
												<Chip
													label={user.role}
													size='small'
													color={roleChipColor[user.role] ?? 'primary'}
													variant='outlined'
													sx={{ fontWeight: 700 }}
												/>
											</Box>
										</Box>

										<Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
											<Typography
												variant='body2'
												sx={{
													fontWeight: 650,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												<Box component='span' sx={{ color: 'text.secondary', fontWeight: 700 }}>
													Joined:{' '}
												</Box>
												{formatDateTime(user.createdAt)}
											</Typography>
										</Box>

										<Box sx={{ justifySelf: 'end', gridColumn: { xs: '2', sm: 'auto' }, gridRow: { xs: '1', sm: 'auto' } }}>
											<ItemActionMenu
												actions={[
													...(isSuperAdmin
														? [{
																label: 'View Details',
																icon: <VisibilityOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
																onClick: () => openDetailsDialog(user),
															}]
														: []),
													{
														label: 'Edit',
														icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
														onClick: () => openEditDialog(user),
													},
													...(isSuperAdmin
														? [{
																label: 'Delete',
																icon: <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />,
																color: 'error' as const,
																onClick: () => void handleDelete(user._id),
															}]
														: []),
												]}
											/>
										</Box>
									</Box>
								</CardContent>
							</Card>
						))
					)}
				</Box>
			)}

			{pagination && (
				<AppPagination
					page={pagination.page}
					totalPages={pagination.totalPages}
					totalItems={pagination.total}
					pageSize={pagination.limit}
					disabled={loading}
					boundaryCount={1}
					middleCount={3}
					align='center'
					onChange={(nextPage) => {
						setPage(nextPage);
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
				/>
			)}

			<AppModal
				open={dialogOpen}
				onClose={closeDialog}
				title={editingUser ? 'Edit User' : 'Create User'}
				onSave={() => void handleSave()}
				saveText={editingUser ? 'Save' : 'Create'}
				saving={saving}
				maxWidth='sm'
			>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						<TextField
							label='Name'
							value={form.name}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							fullWidth
							required
						/>
						<TextField
							label='Email'
							type='email'
							value={form.email}
							onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
							fullWidth
							required
						/>
						<TextField
							label='Password'
							type='password'
							value={form.password}
							onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
							fullWidth
							required={!editingUser}
							helperText={editingUser ? 'Leave blank to keep the current password' : undefined}
						/>
						<FormControl fullWidth>
							<Select
								value={form.role}
								onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as IUser['role'] }))}
							>
								{USER_ROLES.map((role) => (
									<MenuItem key={role} value={role}>{role}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
			</AppModal>

			<AppModal
				open={Boolean(detailsUser)}
				onClose={closeDetailsDialog}
				title='User Details'
				maxWidth='md'
				cancelText='Close'
				cancelButtonSx={{
					color: 'error.main',
					fontWeight: 800,
					'&:hover': {
						bgcolor: 'rgba(211, 47, 47, 0.08)',
					},
				}}
			>
				{detailsUser && (
					<Box>
						{(() => {
							const enrollmentSummary = getEnrollmentSummary(detailsUser);
							const spendingSummary = getSpendingSummary(detailsUser);
							const subscriptionStatus = getSubscriptionStatus(detailsUser);

							return (
								<>
									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
										<Avatar
											src={detailsUser.avatar}
											alt={detailsUser.name}
											sx={{
												width: 104,
												height: 104,
												fontSize: 34,
												fontWeight: 900,
												bgcolor: 'primary.main',
												mb: 1.5,
												boxShadow: '0 14px 32px rgba(21, 101, 192, 0.2)',
											}}
										>
											{getInitials(detailsUser.name)}
										</Avatar>
										<Typography variant='h5' sx={{ fontWeight: 900, textAlign: 'center' }}>
											{detailsUser.name}
										</Typography>
										<Chip
											label={detailsUser.role}
											color={roleChipColor[detailsUser.role] ?? 'primary'}
											variant='outlined'
											sx={{
												mt: 1.5,
												height: 30,
												fontSize: '0.875rem',
												fontWeight: 850,
											}}
										/>
									</Box>

									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: {
												xs: '1fr',
												sm: 'repeat(2, minmax(0, 1fr))',
												md: 'repeat(3, minmax(0, 1fr))',
											},
											gap: 1.5,
										}}
									>
										<DetailItem label='User ID' value={detailsUser._id} />
										<DetailItem label='Name' value={detailsUser.name} />
										<DetailItem label='Email' value={detailsUser.email} />
										<DetailItem
											label='Role'
											value={
												<Chip
													label={detailsUser.role}
													size='small'
													color={roleChipColor[detailsUser.role] ?? 'primary'}
													variant='outlined'
													sx={{ fontWeight: 800 }}
												/>
											}
										/>
										<DetailItem label='Total Enrolled Courses' value={enrollmentSummary.total} />
										<DetailItem label='Free Courses Enrolled' value={enrollmentSummary.free} />
										<DetailItem label='Paid Courses Purchased' value={enrollmentSummary.paid} />
										<DetailItem label='Subscription Courses Enrolled' value={enrollmentSummary.subscription} />
										<DetailItem label='Total Amount Spent' value={formatCurrency(spendingSummary.total)} />
										<DetailItem label='Paid Course Spend' value={formatCurrency(spendingSummary.paidCourses)} />
										<DetailItem label='Subscription Spend' value={formatCurrency(spendingSummary.subscriptions)} />
										<DetailItem
											label='Subscription Plan'
											value={detailsUser.activeSubscription?.plan ?? 'No active subscription'}
										/>
										<DetailItem
											label='Subscription Status'
											value={
												<Chip
													label={subscriptionStatus}
													size='small'
													color={
														subscriptionStatus === 'Active'
															? 'success'
															: subscriptionStatus === 'Expired'
																? 'warning'
																: 'default'
													}
													sx={{ fontWeight: 800 }}
												/>
											}
										/>
										<DetailItem
											label='Subscription Start'
											value={
												detailsUser.activeSubscription?.startDate
													? formatDateTime(detailsUser.activeSubscription.startDate)
													: 'Not available'
											}
										/>
										<DetailItem
											label='Subscription End'
											value={
												detailsUser.activeSubscription?.endDate
													? formatDateTime(detailsUser.activeSubscription.endDate)
													: 'Not available'
											}
										/>
										<DetailItem label='Created At' value={formatDateTime(detailsUser.createdAt)} />
										<DetailItem
											label='Updated At'
											value={detailsUser.updatedAt ? formatDateTime(detailsUser.updatedAt) : 'Not available'}
										/>
									</Box>
								</>
							);
						})()}
					</Box>
				)}
			</AppModal>
		</Box>
	);
};

export default UsersPage;
