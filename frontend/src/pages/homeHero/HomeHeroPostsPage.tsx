import { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AppModal from '../../components/common/AppModal';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { homeHeroPostService } from '../../services/homeHeroPost.service';
import type { HomeHeroPostVisibility, IHomeHeroPost, ISiteLogo } from '../../types/index';

type FormState = {
	visibility: HomeHeroPostVisibility;
	publishAt: string;
	order: string;
};

const emptyForm: FormState = {
	visibility: 'Private',
	publishAt: '',
	order: '',
};

const toInputDateTime = (value?: string) => {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const offsetMs = date.getTimezoneOffset() * 60_000;
	return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toApiDateTime = (value: string) => (value ? new Date(value).toISOString() : '');

export default function HomeHeroPostsPage() {
	const { confirm } = useConfirmModal();
	const [posts, setPosts] = useState<IHomeHeroPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPost, setEditingPost] = useState<IHomeHeroPost | null>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [logo, setLogo] = useState<ISiteLogo | null>(null);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoLoading, setLogoLoading] = useState(true);
	const [logoSaving, setLogoSaving] = useState(false);

	const sortedPosts = useMemo(
		() => [...posts].sort((a, b) => a.order - b.order || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
		[posts],
	);

	const loadPosts = () => {
		setLoading(true);
		homeHeroPostService
			.getAll()
			.then((res) => setPosts(res.data ?? []))
			.catch(() => setPosts([]))
			.finally(() => setLoading(false));
	};

	const loadLogo = () => {
		setLogoLoading(true);
		homeHeroPostService
			.getLogo()
			.then((res) => setLogo(res.data ?? null))
			.catch(() => setLogo(null))
			.finally(() => setLogoLoading(false));
	};

	useEffect(() => {
		loadPosts();
		loadLogo();
	}, []);

	const openCreate = () => {
		setEditingPost(null);
		setFiles([]);
		setForm({ ...emptyForm, order: String(sortedPosts.length) });
		setDialogOpen(true);
	};

	const openEdit = (post: IHomeHeroPost) => {
		setEditingPost(post);
		setFiles([]);
		setForm({
			visibility: post.visibility,
			publishAt: toInputDateTime(post.publishAt),
			order: String(post.order),
		});
		setDialogOpen(true);
	};

	const handleSave = async () => {
		if (!editingPost && files.length === 0) return;
		setSaving(true);
		try {
			const data = new FormData();
			data.append('visibility', form.visibility);
			data.append('order', form.order || '0');
			if (form.publishAt || editingPost) data.append('publishAt', toApiDateTime(form.publishAt));

			if (editingPost) {
				if (files[0]) data.append('image', files[0]);
				await homeHeroPostService.update(editingPost._id, data);
			} else {
				files.forEach((file) => data.append('images', file));
				await homeHeroPostService.create(data);
			}

			setDialogOpen(false);
			loadPosts();
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (post: IHomeHeroPost) => {
		const ok = await confirm({
			title: 'Delete Hero Image',
			message: 'Remove this homepage header image permanently?',
			confirmText: 'Delete',
			cancelText: 'Cancel',
		});
		if (!ok) return;
		await homeHeroPostService.delete(post._id);
		loadPosts();
	};

	const movePost = async (post: IHomeHeroPost, direction: -1 | 1) => {
		const index = sortedPosts.findIndex((item) => item._id === post._id);
		const target = index + direction;
		if (index < 0 || target < 0 || target >= sortedPosts.length) return;
		const next = [...sortedPosts];
		[next[index], next[target]] = [next[target], next[index]];
		setPosts(next.map((item, order) => ({ ...item, order })));
		await homeHeroPostService.reorder(next.map((item) => item._id));
		loadPosts();
	};

	const toggleVisibility = async (post: IHomeHeroPost) => {
		const data = new FormData();
		data.append('visibility', post.visibility === 'Public' ? 'Private' : 'Public');
		data.append('order', String(post.order));
		if (post.publishAt) data.append('publishAt', post.publishAt);
		await homeHeroPostService.update(post._id, data);
		loadPosts();
	};

	const handleLogoSave = async () => {
		if (!logoFile) return;
		setLogoSaving(true);
		try {
			const data = new FormData();
			data.append('logo', logoFile);
			await homeHeroPostService.updateLogo(data);
			setLogoFile(null);
			loadLogo();
		} finally {
			setLogoSaving(false);
		}
	};

	return (
		<Box sx={{ p: { xs: 2, md: 3 } }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
				<Box>
					<Typography variant='h4' sx={{ fontWeight: 900 }}>
						Homepage Header Showcase
					</Typography>
					<Typography color='text.secondary' sx={{ mt: 0.5 }}>
						Manage the public header logo and image-only homepage slider posts.
					</Typography>
				</Box>
			</Box>

			<Paper variant='outlined' sx={{ borderRadius: 1, overflow: 'hidden', mb: 3 }}>
				<Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
					<Typography sx={{ fontWeight: 800 }}>Site logo</Typography>
					<Typography variant='caption' color='text.secondary'>
						Upload one public logo for the website header. Recommended size: 320 x 96 px transparent PNG or WebP.
					</Typography>
				</Box>
				<Grid container spacing={2} sx={{ p: 2, alignItems: 'center' }}>
					<Grid size={{ xs: 12, md: 5 }}>
						<Paper
							variant='outlined'
							sx={{
								minHeight: 126,
								borderRadius: 1,
								bgcolor: 'grey.50',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								p: 2,
							}}
						>
							{logoLoading ? (
								<CircularProgress size={28} />
							) : logo ? (
								<Box component='img' src={logo.imageUrl} alt='Site logo' sx={{ maxWidth: '100%', maxHeight: 86, objectFit: 'contain' }} />
							) : (
								<Typography color='text.secondary' sx={{ fontWeight: 700 }}>
									No logo uploaded yet.
								</Typography>
							)}
						</Paper>
					</Grid>
					<Grid size={{ xs: 12, md: 7 }}>
						<Stack spacing={1.5}>
							<Button component='label' variant='outlined' startIcon={<CloudUploadIcon />} sx={{ justifyContent: 'flex-start', borderRadius: 0.5, fontWeight: 800 }}>
								Choose logo image
								<input hidden type='file' accept='image/*' onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
							</Button>
							<Typography variant='body2' color='text.secondary'>
								{logoFile ? `${logoFile.name} (${Math.round(logoFile.size / 1024)} KB)` : 'Select a clean horizontal logo. Uploading a new file replaces the current logo.'}
							</Typography>
							{logo?.imageWidth && logo?.imageHeight && (
								<Typography variant='caption' color='text.secondary'>
									Current logo size: {logo.imageWidth} x {logo.imageHeight}px
								</Typography>
							)}
							<Box>
								<Button variant='contained' onClick={() => void handleLogoSave()} disabled={!logoFile || logoSaving} sx={{ fontWeight: 800, borderRadius: 0.5 }}>
									{logoSaving ? 'Saving...' : logo ? 'Update Logo' : 'Save Logo'}
								</Button>
							</Box>
						</Stack>
					</Grid>
				</Grid>
			</Paper>

			<Paper variant='outlined' sx={{ borderRadius: 1, overflow: 'hidden' }}>
				<Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
					<Box>
						<Typography sx={{ fontWeight: 800 }}>Header slider images</Typography>
						<Typography variant='caption' color='text.secondary'>
							Recommended upload size: 2048 x 460 px or the same wide banner ratio. Actual dimensions are shown on each image after upload.
						</Typography>
					</Box>
					<Button variant='contained' startIcon={<AddPhotoAlternateIcon />} onClick={openCreate} sx={{ fontWeight: 800, borderRadius: 0.5, flexShrink: 0 }}>
						Upload Images
					</Button>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
						<CircularProgress />
					</Box>
				) : sortedPosts.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
						<AddPhotoAlternateIcon sx={{ fontSize: 54, opacity: 0.25, mb: 1 }} />
						<Typography sx={{ fontWeight: 700 }}>No header images uploaded yet.</Typography>
					</Box>
				) : (
					<Grid container spacing={2} sx={{ p: 2 }}>
						{sortedPosts.map((post, index) => {
							const isScheduled = post.publishAt && new Date(post.publishAt).getTime() > Date.now();
							return (
								<Grid key={post._id} size={{ xs: 12, md: 6, lg: 4 }}>
									<Paper variant='outlined' sx={{ borderRadius: 1, overflow: 'hidden', height: '100%' }}>
										<Box sx={{ position: 'relative', aspectRatio: '16 / 5', bgcolor: 'grey.100' }}>
											<Box component='img' src={post.imageUrl} alt='' loading='lazy' sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
											<Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.75 }}>
												<Chip label={`#${index + 1}`} size='small' sx={{ fontWeight: 900, bgcolor: 'common.white' }} />
												<Chip label={post.visibility} size='small' color={post.visibility === 'Public' ? 'success' : 'default'} sx={{ fontWeight: 800 }} />
												{isScheduled && <Chip label='Scheduled' size='small' color='warning' sx={{ fontWeight: 800 }} />}
											</Box>
											<Box sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 1 }}>
												<ItemActionMenu
													actions={[
														{ label: 'Edit', icon: <EditIcon />, onClick: () => openEdit(post) },
														{ label: post.visibility === 'Public' ? 'Make Private' : 'Make Public', icon: post.visibility === 'Public' ? <VisibilityOffIcon /> : <VisibilityIcon />, onClick: () => void toggleVisibility(post) },
														{ label: 'Move Up', icon: <ArrowUpwardIcon />, onClick: () => void movePost(post, -1) },
														{ label: 'Move Down', icon: <ArrowDownwardIcon />, onClick: () => void movePost(post, 1) },
														{ label: 'Delete', icon: <DeleteIcon />, color: 'error', onClick: () => void handleDelete(post) },
													]}
												/>
											</Box>
										</Box>
										<Box sx={{ p: 1.5 }}>
											<Typography variant='body2' sx={{ fontWeight: 800 }}>
												{post.imageWidth && post.imageHeight ? `${post.imageWidth} x ${post.imageHeight}px` : 'Image dimensions unavailable'}
											</Typography>
											<Typography variant='caption' color='text.secondary'>
												{post.publishAt ? `Publishes ${new Date(post.publishAt).toLocaleString()}` : 'Publishes immediately when public'}
											</Typography>
										</Box>
									</Paper>
								</Grid>
							);
						})}
					</Grid>
				)}
			</Paper>

			<AppModal
				open={dialogOpen}
				title={editingPost ? 'Edit Header Image' : 'Upload Header Images'}
				onClose={() => setDialogOpen(false)}
				onSave={() => void handleSave()}
				saveText={editingPost ? 'Update' : 'Upload'}
				saving={saving}
				saveDisabled={!editingPost && files.length === 0}
				maxWidth='sm'
			>
				<Stack spacing={2}>
					<Button
						component='label'
						variant='outlined'
						sx={{
							minHeight: 132,
							borderRadius: 1,
							borderStyle: 'dashed',
							borderWidth: 2,
							fontWeight: 800,
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
							justifyContent: 'center',
							textAlign: 'center',
						}}
					>
						<AddPhotoAlternateIcon sx={{ fontSize: 40 }} />
						{editingPost ? 'Choose replacement banner image' : 'Choose one or more banner images'}
						<input
							hidden
							type='file'
							accept='image/*'
							multiple={!editingPost}
							onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
						/>
					</Button>
					<Typography variant='caption' color='text.secondary'>
						Recommended full header image size: 2048px wide x 460px high. Use compressed JPG/WebP images for faster homepage loading.
					</Typography>
					{files.length > 0 && (
						<Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
							{files.map((file) => (
								<Typography key={`${file.name}-${file.size}`} variant='body2'>
									{file.name} ({Math.round(file.size / 1024)} KB)
								</Typography>
							))}
						</Box>
					)}
					<FormControl fullWidth size='small'>
						<InputLabel>Visibility</InputLabel>
						<Select
							label='Visibility'
							value={form.visibility}
							onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value as HomeHeroPostVisibility }))}
						>
							<MenuItem value='Private'>Private</MenuItem>
							<MenuItem value='Public'>Public</MenuItem>
						</Select>
					</FormControl>
					<TextField
						size='small'
						type='datetime-local'
						label='Schedule publish'
						value={form.publishAt}
						onChange={(event) => setForm((current) => ({ ...current, publishAt: event.target.value }))}
						slotProps={{ inputLabel: { shrink: true } }}
						helperText='Public images with a future schedule appear automatically after this date and time.'
					/>
					<TextField
						size='small'
						type='number'
						label='Position'
						value={form.order}
						onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
						helperText='Lower numbers appear first in the homepage slider.'
					/>
				</Stack>
			</AppModal>
		</Box>
	);
}
