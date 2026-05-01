import { useEffect, useState } from 'react';
import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	MenuItem,
	Select,
	FormControl,
	CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { userService } from '../../services/user.service';
import type { IUser } from '../../types/index';

const USER_ROLES: IUser['role'][] = [
	'Super Admin',
	'Admin',
	'Moderator',
	'Teacher',
	'Student',
];

export default function UsersPage() {
	const [users, setUsers] = useState<IUser[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = () => {
		userService
			.getAll()
			.then((res) => setUsers(res.data ?? []))
			.finally(() => setLoading(false));
	};

	const handleRoleChange = async (userId: string, newRole: IUser['role']) => {
		try {
			await userService.updateRole(userId, newRole);
			toast.success('Role updated');
			loadUsers();
		} catch (error) {
			toast.error('Failed to update role');
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this user?')) return;
		try {
			await userService.delete(id);
			toast.success('User deleted');
			loadUsers();
		} catch (error) {
			toast.error('Failed to delete user');
		}
	};

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 3 }}>
				Users
			</Typography>

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
										{new Date(user.createdAt).toLocaleDateString()}
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
		</Box>
	);
}
