import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	Chip,
	CircularProgress,
	MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import toast from 'react-hot-toast';
import { subscriptionService } from '../../services/subscription.service';
import { userService } from '../../services/user.service';
import type { ISubscription, IUser, SubscriptionPlan } from '../../types/index';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
	'Basic',
	'Premium',
	'Gold',
	'Quiz Only',
];

export default function SubscriptionsPage() {
	const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
	const [users, setUsers] = useState<IUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState({
		userId: '',
		plan: 'Basic' as SubscriptionPlan,
		endDate: '',
	});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = () => {
		Promise.all([
			subscriptionService
				.getAll()
				.then((res) => setSubscriptions(res.data ?? [])),
			userService.getAll().then((res) => setUsers(res.data ?? [])),
		]).finally(() => setLoading(false));
	};

	const handleOpenDialog = () => {
		setForm({
			userId: '',
			plan: 'Basic',
			endDate: '',
		});
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
	};

	const handleSave = async () => {
		if (!form.userId || !form.plan || !form.endDate) {
			toast.error('All fields are required');
			return;
		}
		setSaving(true);
		try {
			await subscriptionService.assign(form);
			toast.success('Subscription assigned');
			loadData();
			handleCloseDialog();
		} catch (error) {
			toast.error('Failed to assign subscription');
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = async (id: string) => {
		if (!confirm('Are you sure you want to cancel this subscription?')) return;
		try {
			await subscriptionService.cancel(id);
			toast.success('Subscription cancelled');
			loadData();
		} catch (error) {
			toast.error('Failed to cancel subscription');
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Active':
				return 'success';
			case 'Cancelled':
				return 'error';
			case 'Expired':
				return 'warning';
			default:
				return 'default';
		}
	};

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					Subscriptions
				</Typography>
				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={handleOpenDialog}
				>
					Assign Subscription
				</Button>
			</Box>

			{loading ? (
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
								<TableCell sx={{ fontWeight: 600, width: 120 }}>
									Actions
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{subscriptions.map((sub) => (
								<TableRow key={sub._id}>
									<TableCell>{(sub.user as IUser).name}</TableCell>
									<TableCell>{sub.plan}</TableCell>
									<TableCell>
										<Chip
											label={sub.status}
											size='small'
											color={getStatusColor(sub.status)}
										/>
									</TableCell>
									<TableCell>
										{new Date(sub.startDate).toLocaleDateString()}
									</TableCell>
									<TableCell>
										{new Date(sub.endDate).toLocaleDateString()}
									</TableCell>
									<TableCell>
										{(sub.assignedBy as IUser)?.name || 'System'}
									</TableCell>
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
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog
				open={dialogOpen}
				onClose={handleCloseDialog}
				maxWidth='sm'
				fullWidth
			>
				<DialogTitle>Assign Subscription</DialogTitle>
				<DialogContent>
					<TextField
						label='User'
						select
						value={form.userId}
						onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
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
						value={form.plan}
						onChange={(e) =>
							setForm((p) => ({
								...p,
								plan: e.target.value as SubscriptionPlan,
							}))
						}
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
						value={form.endDate}
						onChange={(e) =>
							setForm((p) => ({ ...p, endDate: e.target.value }))
						}
						fullWidth
						sx={{ mt: 2 }}
						slotProps={{ inputLabel: { shrink: true } }}
						required
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>Cancel</Button>
					<Button variant='contained' onClick={handleSave} disabled={saving}>
						{saving ? <CircularProgress size={18} /> : 'Assign'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
