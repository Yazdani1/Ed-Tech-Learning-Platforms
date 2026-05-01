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
import { categoryService } from '../../services/category.service';
import type { ICategory } from '../../types/index';

export default function CategoriesPage() {
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<ICategory | null>(
		null,
	);
	const [form, setForm] = useState({ name: '', description: '' });
	const [saving, setSaving] = useState(false);

	const loadCategories = () => {
		categoryService
			.getAll()
			.then((res) => setCategories(res.data ?? []))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadCategories();
	}, []);

	const handleOpenDialog = (category?: ICategory) => {
		if (category) {
			setEditingCategory(category);
			setForm({ name: category.name, description: category.description || '' });
		} else {
			setEditingCategory(null);
			setForm({ name: '', description: '' });
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingCategory(null);
		setForm({ name: '', description: '' });
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error('Category name is required');
			return;
		}
		setSaving(true);
		try {
			if (editingCategory) {
				await categoryService.update(editingCategory._id, form);
				toast.success('Category updated');
			} else {
				await categoryService.create(form);
				toast.success('Category created');
			}
			loadCategories();
			handleCloseDialog();
		} catch (error) {
			toast.error('Failed to save category');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this category?')) return;
		try {
			await categoryService.delete(id);
			toast.success('Category deleted');
			loadCategories();
		} catch (error) {
			toast.error('Failed to delete category');
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
					Categories
				</Typography>
				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={() => handleOpenDialog()}
				>
					Add Category
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
								<TableCell sx={{ fontWeight: 600, width: 120 }}>
									Actions
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{categories.map((category) => (
								<TableRow key={category._id}>
									<TableCell>{category.name}</TableCell>
									<TableCell>{category.slug}</TableCell>
									<TableCell>{category.description || '-'}</TableCell>
									<TableCell>
										<IconButton
											size='small'
											onClick={() => handleOpenDialog(category)}
											sx={{ mr: 1 }}
										>
											<EditIcon />
										</IconButton>
										<IconButton
											size='small'
											color='error'
											onClick={() => handleDelete(category._id)}
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

			<Dialog
				open={dialogOpen}
				onClose={handleCloseDialog}
				maxWidth='sm'
				fullWidth
			>
				<DialogTitle>
					{editingCategory ? 'Edit Category' : 'Add Category'}
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
						onChange={(e) =>
							setForm((p) => ({ ...p, description: e.target.value }))
						}
						fullWidth
						multiline
						rows={3}
						sx={{ mt: 2 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>Cancel</Button>
					<Button variant='contained' onClick={handleSave} disabled={saving}>
						{saving ? <CircularProgress size={18} /> : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
