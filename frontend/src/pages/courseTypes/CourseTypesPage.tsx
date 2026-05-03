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
	CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { courseTypeService } from '../../services/courseType.service';
import type { ICourseType } from '../../types/index';

export default function CourseTypesPage() {
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingCourseType, setEditingCourseType] = useState<ICourseType | null>(null);
	const [form, setForm] = useState({ name: '', description: '' });
	const [saving, setSaving] = useState(false);

	const loadCourseTypes = () => {
		courseTypeService
			.getAll()
			.then((res) => setCourseTypes(res.data ?? []))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadCourseTypes();
	}, []);

	const handleOpenDialog = (courseType?: ICourseType) => {
		if (courseType) {
			setEditingCourseType(courseType);
			setForm({ name: courseType.name, description: courseType.description || '' });
		} else {
			setEditingCourseType(null);
			setForm({ name: '', description: '' });
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingCourseType(null);
		setForm({ name: '', description: '' });
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error('Course type name is required');
			return;
		}
		setSaving(true);
		try {
			if (editingCourseType) {
				await courseTypeService.update(editingCourseType._id, form);
				toast.success('Course type updated');
			} else {
				await courseTypeService.create(form);
				toast.success('Course type created');
			}
			loadCourseTypes();
			handleCloseDialog();
		} catch {
			toast.error('Failed to save course type');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this course type?')) return;
		try {
			await courseTypeService.delete(id);
			toast.success('Course type deleted');
			loadCourseTypes();
		} catch {
			toast.error('Failed to delete course type');
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
					Course Types
				</Typography>
				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={() => handleOpenDialog()}
				>
					Add Course Type
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
								<TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
								<TableCell sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{courseTypes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} align='center' sx={{ py: 6, color: 'text.secondary' }}>
										No course types yet. Create one to get started.
									</TableCell>
								</TableRow>
							) : (
								courseTypes.map((ct) => (
									<TableRow key={ct._id}>
										<TableCell>{ct.name}</TableCell>
										<TableCell>{ct.slug}</TableCell>
										<TableCell>{ct.description || '-'}</TableCell>
										<TableCell>
											<IconButton
												size='small'
												onClick={() => handleOpenDialog(ct)}
												sx={{ mr: 1 }}
											>
												<EditIcon />
											</IconButton>
											<IconButton
												size='small'
												color='error'
												onClick={() => void handleDelete(ct._id)}
											>
												<DeleteIcon />
											</IconButton>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
				<DialogTitle>
					{editingCourseType ? 'Edit Course Type' : 'Add Course Type'}
				</DialogTitle>
				<DialogContent>
					<TextField
						label='Name'
						value={form.name}
						onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						fullWidth
						sx={{ mt: 2 }}
						required
					/>
					<TextField
						label='Description'
						value={form.description}
						onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
						fullWidth
						multiline
						rows={3}
						sx={{ mt: 2 }}
					/>
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
