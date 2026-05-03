import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { userService } from '../../services/user.service';
import type { IUser } from '../../types/index';
import { formatDateTime } from '../../utils/dateTime';

const USER_ROLES: IUser['role'][] = [
	'Super Admin',
	'Admin',
	'Moderator',
	'Teacher',
	'Student',
];

const DEFAULT_FORM = { name: '', email: '', password: '', role: 'Student' as IUser['role'] };

export default function UsersPage() {
	const [users, setUsers] = useState<IUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState(DEFAULT_FORM);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = () => {
		userService
			.getAll()
			.then((res) => setUsers(res.data ?? []))
			.finally(() => setLoading(false));
	};

	const handleCreate = async () => {
		if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
			toast.error('Name, email and password are required');
			return;
		}
		setSaving(true);
		try {
			await userService.create(form);
			toast.success('User created');
			setDialogOpen(false);
			setForm(DEFAULT_FORM);
			loadUsers();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to create user';
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	const handleRoleChange = async (userId: string, newRole: IUser['role']) => {
		try {
			await userService.updateRole(userId, newRole);
			toast.success('Role updated');
			loadUsers();
		} catch {
			toast.error('Failed to update role');
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this user?')) return;
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
				<Button variant='contained' startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
					Create User
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
								<TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
								<TableCell sx={{ fontWeight: 600, width: 120 }}>
									Actions
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user._id}>
									<TableCell>{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<FormControl size='small'>
											<Select
												value={user.role}
												onChange={(e) =>
													handleRoleChange(
														user._id,
														e.target.value as IUser['role'],
													)
												}
												sx={{ minWidth: 120 }}
											>
												{USER_ROLES.map((role) => (
													<MenuItem key={role} value={role}>
														{role}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</TableCell>
									<TableCell>
										{formatDateTime(user.createdAt)}
									</TableCell>
									<TableCell>
										<IconButton
											size='small'
											color='error'
											onClick={() => handleDelete(user._id)}
										>
											<DeleteIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Create User Dialog */}
			<Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setForm(DEFAULT_FORM); }} maxWidth='sm' fullWidth>
				<DialogTitle>Create User</DialogTitle>
				<DialogContent>
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
							required
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
				</DialogContent>
				<DialogActions>
					<Button onClick={() => { setDialogOpen(false); setForm(DEFAULT_FORM); }}>Cancel</Button>
					<Button variant='contained' onClick={() => void handleCreate()} disabled={saving}>
						{saving ? <CircularProgress size={18} /> : 'Create'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
