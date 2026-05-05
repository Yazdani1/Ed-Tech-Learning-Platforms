import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import toast from 'react-hot-toast';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useAuth } from '../../context/useAuth';
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
	const { user: currentUser } = useAuth();
	const [users, setUsers] = useState<IUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<IUser | null>(null);
	const [form, setForm] = useState(DEFAULT_FORM);
	const [saving, setSaving] = useState(false);
	const isSuperAdmin = currentUser?.role === 'Super Admin';

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = () => {
		userService
			.getAll()
			.then((res) => setUsers(res.data ?? []))
			.finally(() => setLoading(false));
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
				<Button variant='contained' startIcon={<AddIcon />} onClick={openCreateDialog}>
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
										<Chip label={user.role} size='small' variant='outlined' />
									</TableCell>
									<TableCell>
										{formatDateTime(user.createdAt)}
									</TableCell>
									<TableCell>
										<ItemActionMenu
											actions={[
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
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog open={dialogOpen} onClose={closeDialog} maxWidth='sm' fullWidth>
				<DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
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
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDialog}>Cancel</Button>
					<Button variant='contained' onClick={() => void handleSave()} disabled={saving}>
						{saving ? <CircularProgress size={18} /> : editingUser ? 'Save' : 'Create'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
