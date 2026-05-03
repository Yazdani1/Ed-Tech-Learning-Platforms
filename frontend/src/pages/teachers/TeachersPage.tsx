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
	Avatar,
	FormControl,
	IconButton,
	InputLabel,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import toast from 'react-hot-toast';
import { teacherService } from '../../services/teacher.service';
import { userService } from '../../services/user.service';
import type { ITeacher, IUser } from '../../types/index';

const EMPTY_FORM = {
	name: '',
	bio: '',
	expertise: '',
	socialLinks: '',
	profileImage: null as File | null,
	userId: '',
};

export default function TeachersPage() {
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [teacherUsers, setTeacherUsers] = useState<IUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTeacher, setEditingTeacher] = useState<ITeacher | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadTeachers();
		loadTeacherUsers();
	}, []);

	const loadTeachers = () => {
		teacherService
			.getAll()
			.then((res) => setTeachers(res.data ?? []))
			.finally(() => setLoading(false));
	};

	const loadTeacherUsers = () => {
		userService.getAll().then((res) => {
			setTeacherUsers((res.data ?? []).filter((u) => u.role === 'Teacher'));
		});
	};

	const handleOpenDialog = (teacher?: ITeacher) => {
		if (teacher) {
			setEditingTeacher(teacher);
			setForm({
				name: teacher.name,
				bio: teacher.bio,
				expertise: teacher.expertise.join(', '),
				socialLinks: teacher.socialLinks ? JSON.stringify(teacher.socialLinks, null, 2) : '',
				profileImage: null,
				userId: teacher.userId ?? '',
			});
		} else {
			setEditingTeacher(null);
			setForm(EMPTY_FORM);
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingTeacher(null);
		setForm(EMPTY_FORM);
	};

	const handleSave = async () => {
		if (!form.name.trim() || !form.bio.trim()) {
			toast.error('Name and bio are required');
			return;
		}
		setSaving(true);
		try {
			const fd = new FormData();
			fd.append('name', form.name);
			fd.append('bio', form.bio);
			fd.append('expertise', form.expertise);
			if (form.socialLinks.trim()) fd.append('socialLinks', form.socialLinks);
			if (form.profileImage) fd.append('profileImage', form.profileImage);
			fd.append('userId', form.userId);

			if (editingTeacher) {
				await teacherService.update(editingTeacher._id, fd);
				toast.success('Teacher updated');
			} else {
				await teacherService.create(fd);
				toast.success('Teacher created');
			}
			loadTeachers();
			handleCloseDialog();
		} catch {
			toast.error('Failed to save teacher');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this teacher?')) return;
		try {
			await teacherService.delete(id);
			toast.success('Teacher deleted');
			loadTeachers();
		} catch {
			toast.error('Failed to delete teacher');
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					Teachers
				</Typography>
				<Button variant='contained' startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
					Add Teacher
				</Button>
			</Box>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 600 }}>Avatar</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Bio</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Expertise</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Linked User</TableCell>
								<TableCell sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{teachers.map((teacher) => {
								const linked = teacherUsers.find((u) => u._id === teacher.userId);
								return (
									<TableRow key={teacher._id}>
										<TableCell>
											<Avatar src={teacher.profileImage} alt={teacher.name} sx={{ width: 40, height: 40 }}>
												{teacher.name.charAt(0)}
											</Avatar>
										</TableCell>
										<TableCell>{teacher.name}</TableCell>
										<TableCell sx={{ maxWidth: 300 }}>
											{teacher.bio.length > 100 ? `${teacher.bio.substring(0, 100)}...` : teacher.bio}
										</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
												{teacher.expertise.slice(0, 2).map((exp, i) => (
													<Chip key={i} label={exp} size='small' variant='outlined' />
												))}
												{teacher.expertise.length > 2 && (
													<Chip label={`+${teacher.expertise.length - 2}`} size='small' variant='outlined' />
												)}
											</Box>
										</TableCell>
										<TableCell>
											{linked ? (
												<Box>
													<Typography variant='body2' sx={{ fontWeight: 500 }}>{linked.name}</Typography>
													<Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>{linked.email}</Typography>
													<Typography variant='caption' color='primary.main'>{linked.role}</Typography>
												</Box>
											) : (
												<Typography variant='body2' color='text.disabled'>Not linked</Typography>
											)}
										</TableCell>
										<TableCell>
											<IconButton size='small' onClick={() => handleOpenDialog(teacher)} sx={{ mr: 1 }}>
												<EditIcon />
											</IconButton>
											<IconButton size='small' color='error' onClick={() => handleDelete(teacher._id)}>
												<DeleteIcon />
											</IconButton>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
				<DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
						<TextField
							label='Name'
							value={form.name}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							fullWidth
							required
						/>
						<TextField
							label='Bio'
							value={form.bio}
							onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
							fullWidth
							multiline
							rows={3}
							required
						/>
						<TextField
							label='Expertise (comma-separated)'
							value={form.expertise}
							onChange={(e) => setForm((p) => ({ ...p, expertise: e.target.value }))}
							fullWidth
							placeholder='e.g., Mathematics, Physics, Programming'
						/>
						<TextField
							label='Social Links (JSON)'
							value={form.socialLinks}
							onChange={(e) => setForm((p) => ({ ...p, socialLinks: e.target.value }))}
							fullWidth
							multiline
							rows={4}
							placeholder='{"linkedin": "url", "twitter": "url"}'
						/>
						<FormControl fullWidth>
							<InputLabel>Link to Teacher User Account</InputLabel>
							<Select
								label='Link to Teacher User Account'
								value={form.userId}
								onChange={(e) => {
									const selectedUser = teacherUsers.find((u) => u._id === e.target.value);
									setForm((p) => ({
										...p,
										userId: e.target.value,
										name: selectedUser ? selectedUser.name : p.name,
									}));
								}}
							>
								<MenuItem value=''>
									<em>None</em>
								</MenuItem>
								{teacherUsers.map((u) => (
									<MenuItem key={u._id} value={u._id}>
										{u.name} — {u.email} — {u.role}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Button
							variant='outlined'
							component='label'
							startIcon={<CloudUploadIcon />}
							sx={{ alignSelf: 'flex-start' }}
						>
							Upload Profile Image
							<input
								type='file'
								accept='image/*'
								hidden
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) setForm((p) => ({ ...p, profileImage: file }));
								}}
							/>
						</Button>
						{form.profileImage && (
							<Typography variant='body2' color='text.secondary'>
								Selected: {form.profileImage.name}
							</Typography>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>Cancel</Button>
					<Button variant='contained' onClick={() => void handleSave()} disabled={saving}>
						{saving ? <CircularProgress size={18} /> : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
