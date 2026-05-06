import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	FormControl,
	MenuItem,
	Select,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useAuth } from '../../context/useAuth';
import { useConfirmModal } from '../../context/ConfirmModalContext';
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

const roleChipColor: Partial<Record<IUser['role'], 'primary' | 'secondary' | 'success' | 'warning' | 'info'>> = {
	'Super Admin': 'secondary',
	Admin: 'primary',
	Moderator: 'warning',
	Teacher: 'info',
	Student: 'success',
};

export default function UsersPage() {
	const { user: currentUser } = useAuth();
	const { confirm } = useConfirmModal();
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

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
					<CircularProgress />
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
		</Box>
	);
}
