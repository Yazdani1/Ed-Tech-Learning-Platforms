import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Card,
	Chip,
	CircularProgress,
	IconButton,
	Menu,
	MenuItem,
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import type { ICategory, ICourseType } from '../../types/index';

type ManagerKind = 'category' | 'courseType';
type ManagedItem = ICategory | ICourseType;

interface DialogState {
	kind: ManagerKind;
	item: ManagedItem | null;
	open: boolean;
}

const EMPTY_FORM = { name: '', description: '' };

const CategoriesPage= () => {
	const { confirm } = useConfirmModal();
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [dialog, setDialog] = useState<DialogState>({
		kind: 'category',
		item: null,
		open: false,
	});
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [menuTarget, setMenuTarget] = useState<{
		kind: ManagerKind;
		item: ManagedItem;
	} | null>(null);

	const loadData = () => {
		setLoading(true);
		Promise.all([categoryService.getAll(), courseTypeService.getAll()])
			.then(([categoryRes, courseTypeRes]) => {
				setCategories(categoryRes.data ?? []);
				setCourseTypes(courseTypeRes.data ?? []);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadData();
	}, []);

	const getLabels = (kind: ManagerKind) =>
		kind === 'category'
			? {
					singular: 'Category',
					plural: 'Categories',
					description:
						'Organize courses by subject area so students can browse learning paths faster.',
				}
			: {
					singular: 'Course Type',
					plural: 'Course Types',
					description:
						'Define what students can learn, such as live courses, recorded courses, seminars, and language tracks.',
				};

	const openDialog = (kind: ManagerKind, item: ManagedItem | null = null) => {
		setDialog({ kind, item, open: true });
		setForm({
			name: item?.name ?? '',
			description: item?.description ?? '',
		});
	};

	const closeDialog = () => {
		setDialog((prev) => ({ ...prev, open: false, item: null }));
		setForm(EMPTY_FORM);
	};

	const openMenu = (
		event: React.MouseEvent<HTMLElement>,
		kind: ManagerKind,
		item: ManagedItem,
	) => {
		setMenuAnchor(event.currentTarget);
		setMenuTarget({ kind, item });
	};

	const closeMenu = () => {
		setMenuAnchor(null);
		setMenuTarget(null);
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error(`${getLabels(dialog.kind).singular} name is required`);
			return;
		}

		setSaving(true);
		try {
			if (dialog.kind === 'category') {
				if (dialog.item) {
					await categoryService.update(dialog.item._id, form);
					toast.success('Category updated');
				} else {
					await categoryService.create(form);
					toast.success('Category created');
				}
			} else if (dialog.item) {
				await courseTypeService.update(dialog.item._id, form);
				toast.success('Course type updated');
			} else {
				await courseTypeService.create(form);
				toast.success('Course type created');
			}

			loadData();
			closeDialog();
		} catch {
			toast.error(`Failed to save ${getLabels(dialog.kind).singular.toLowerCase()}`);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!menuTarget) return;
		const labels = getLabels(menuTarget.kind);
		const confirmed = await confirm({
			title: `Delete ${labels.singular}`,
			message: `Are you sure you want to delete this ${labels.singular.toLowerCase()}?`,
			confirmText: `Delete ${labels.singular}`,
			cancelText: `Keep ${labels.singular}`,
		});
		if (!confirmed) {
			closeMenu();
			return;
		}

		try {
			if (menuTarget.kind === 'category') {
				await categoryService.delete(menuTarget.item._id);
				toast.success('Category deleted');
			} else {
				await courseTypeService.delete(menuTarget.item._id);
				toast.success('Course type deleted');
			}
			loadData();
		} catch {
			toast.error(`Failed to delete ${labels.singular.toLowerCase()}`);
		} finally {
			closeMenu();
		}
	};

	const renderManagerCard = (
		kind: ManagerKind,
		items: ManagedItem[],
		accent: string,
	) => {
		const labels = getLabels(kind);

		return (
			<Card
				elevation={0}
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 0.5,
					overflow: 'hidden',
					height: '100%',
				}}
			>
				<Box
					sx={{
						px: 2.5,
						py: 2,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 2,
						borderBottom: '1px solid',
						borderColor: 'divider',
						bgcolor: 'grey.50',
					}}
				>
					<Box>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
							<Box
								sx={{
									width: 10,
									height: 10,
									borderRadius: '50%',
									bgcolor: accent,
								}}
							/>
							<Typography variant='h6' sx={{ fontWeight: 800 }}>
								{labels.plural}
							</Typography>
							<Chip label={items.length} size='small' sx={{ fontWeight: 700 }} />
						</Box>
						<Typography variant='body2' color='text.secondary'>
							{labels.description}
						</Typography>
					</Box>
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={() => openDialog(kind)}
						sx={{ flexShrink: 0, fontWeight: 700 }}
					>
						Add {labels.singular}
					</Button>
				</Box>

				<TableContainer>
					<Table size='small'>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
								<TableCell align='right' sx={{ width: 64, fontWeight: 700 }}>
									Actions
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} align='center' sx={{ py: 6, color: 'text.secondary' }}>
										No {labels.plural.toLowerCase()} yet.
									</TableCell>
								</TableRow>
							) : (
								items.map((item) => (
									<TableRow key={item._id} hover>
										<TableCell sx={{ fontWeight: 650 }}>{item.name}</TableCell>
										<TableCell>
											<Chip label={item.slug} size='small' variant='outlined' />
										</TableCell>
										<TableCell sx={{ color: 'text.secondary', maxWidth: 260 }}>
											{item.description || '-'}
										</TableCell>
										<TableCell align='right'>
											<IconButton
												size='small'
												onClick={(event) => openMenu(event, kind, item)}
											>
												<MoreVertIcon fontSize='small' />
											</IconButton>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Card>
		);
	};

	const activeLabels = getLabels(dialog.kind);

	return (
		<Box>
			<Box sx={{ mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 800 }}>
					Course Setup
				</Typography>
				<Typography variant='body1' color='text.secondary' sx={{ mt: 0.75 }}>
					Manage course categories and course types from one place.
				</Typography>
			</Box>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
						gap: 2.5,
					}}
				>
					{renderManagerCard('category', categories, '#2563eb')}
					{renderManagerCard('courseType', courseTypes, '#0f766e')}
				</Box>
			)}

			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={closeMenu}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<MenuItem
					onClick={() => {
						if (menuTarget) openDialog(menuTarget.kind, menuTarget.item);
						closeMenu();
					}}
				>
					<EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />
					Edit
				</MenuItem>
				<MenuItem onClick={() => void handleDelete()} sx={{ color: 'error.main' }}>
					<DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
					Delete
				</MenuItem>
			</Menu>

			<AppModal
				open={dialog.open}
				onClose={closeDialog}
				title={`${dialog.item ? 'Edit' : 'Add'} ${activeLabels.singular}`}
				onSave={() => void handleSave()}
				saving={saving}
				maxWidth='sm'
			>
					<TextField
						label='Name'
						value={form.name}
						onChange={(event) =>
							setForm((prev) => ({ ...prev, name: event.target.value }))
						}
						fullWidth
						required
						sx={{ mt: 2 }}
					/>
					<TextField
						label='Description'
						value={form.description}
						onChange={(event) =>
							setForm((prev) => ({ ...prev, description: event.target.value }))
						}
						fullWidth
						multiline
						rows={3}
						sx={{ mt: 2 }}
					/>
			</AppModal>
		</Box>
	);
};

export default CategoriesPage;
