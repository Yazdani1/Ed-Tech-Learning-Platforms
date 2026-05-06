import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Avatar,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useConfirmModal } from '../../context/ConfirmModalContext';
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
	const { confirm } = useConfirmModal();
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
		const confirmed = await confirm({
			title: 'Delete Teacher',
			message: 'Are you sure you want to delete this teacher?',
			confirmText: 'Delete Teacher',
			cancelText: 'Keep Teacher',
		});
		if (!confirmed) return;
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
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							sm: 'repeat(2, minmax(0, 1fr))',
							lg: 'repeat(3, minmax(0, 1fr))',
							xl: 'repeat(4, minmax(0, 1fr))',
						},
						gap: 2.5,
					}}
				>
					{teachers.length === 0 ? (
						<Box
							sx={{
								gridColumn: '1 / -1',
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1,
								py: 8,
								textAlign: 'center',
								color: 'text.secondary',
							}}
						>
							No teachers yet.
						</Box>
					) : (
						teachers.map((teacher) => {
							const linked = teacherUsers.find((u) => u._id === teacher.userId);
							const bio = teacher.bio.length > 130 ? `${teacher.bio.substring(0, 130)}...` : teacher.bio;

							return (
								<Card
									key={teacher._id}
									elevation={0}
									sx={{
										position: 'relative',
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: 1,
										height: '100%',
									}}
								>
									<Box sx={{ position: 'absolute', top: 10, right: 10 }}>
										<ItemActionMenu
											actions={[
												{
													label: 'Edit',
													icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
													onClick: () => handleOpenDialog(teacher),
												},
												{
													label: 'Delete',
													color: 'error',
													icon: <DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
													onClick: () => void handleDelete(teacher._id),
												},
											]}
										/>
									</Box>
									<CardContent
										sx={{
											p: 2.5,
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											textAlign: 'center',
											height: '100%',
										}}
									>
										<Avatar
											src={teacher.profileImage}
											alt={teacher.name}
											sx={{
												width: 96,
												height: 96,
												mb: 1.5,
												fontSize: 36,
												fontWeight: 800,
											}}
										>
											{teacher.name.charAt(0)}
										</Avatar>
										<Typography variant='h6' sx={{ fontWeight: 800, pr: 2, pl: 2 }}>
											{teacher.name}
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{ mt: 1, minHeight: 58, lineHeight: 1.55 }}
										>
											{bio}
										</Typography>

										<Box
											sx={{
												display: 'flex',
												flexWrap: 'wrap',
												justifyContent: 'center',
												gap: 0.75,
												mt: 2,
												minHeight: 28,
											}}
										>
											{teacher.expertise.slice(0, 3).map((exp, index) => (
												<Chip key={`${exp}-${index}`} label={exp} size='small' variant='outlined' />
											))}
											{teacher.expertise.length > 3 && (
												<Chip label={`+${teacher.expertise.length - 3}`} size='small' variant='outlined' />
											)}
										</Box>

										<Box sx={{ mt: 'auto', pt: 2.25, width: '100%' }}>
											{linked ? (
												<Box
													sx={{
														borderTop: '1px solid',
														borderColor: 'divider',
														pt: 1.5,
													}}
												>
													<Typography variant='body2' sx={{ fontWeight: 700 }}>
														{linked.name}
													</Typography>
													<Typography
														variant='caption'
														color='text.secondary'
														sx={{ display: 'block', overflowWrap: 'anywhere' }}
													>
														{linked.email}
													</Typography>
													<Chip label={linked.role} size='small' color='primary' variant='outlined' sx={{ mt: 1 }} />
												</Box>
											) : (
												<Typography
													variant='body2'
													color='text.disabled'
													sx={{
														borderTop: '1px solid',
														borderColor: 'divider',
														pt: 1.5,
													}}
												>
													Not linked
												</Typography>
											)}
										</Box>
									</CardContent>
								</Card>
							);
						})
					)}
				</Box>
			)}

			<AppModal
				open={dialogOpen}
				onClose={handleCloseDialog}
				title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
				onSave={() => void handleSave()}
				saving={saving}
				maxWidth='md'
			>
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
			</AppModal>
		</Box>
	);
}
