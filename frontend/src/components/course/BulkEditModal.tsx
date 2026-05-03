import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	FormGroup,
	FormLabel,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Switch,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import { teacherService } from '../../services/teacher.service';
import type { ICourse, ICategory, ICourseType, ITeacher, SubscriptionPlan } from '../../types/index';

const PLANS: SubscriptionPlan[] = ['Basic', 'Premium', 'Gold', 'Quiz Only'];

// A labelled field block inside the card
function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Box>
			<Typography
				variant='caption'
				sx={{
					fontWeight: 700,
					textTransform: 'uppercase',
					letterSpacing: 0.75,
					color: 'text.secondary',
					display: 'block',
					mb: 0.75,
				}}
			>
				{label}
			</Typography>
			{children}
		</Box>
	);
}

type FormState = {
	courseType: string;
	category: string;
	visibility: '' | 'Public' | 'Private';
	pricing: '' | 'Free' | 'Paid';
	price: string;
	subscriptionIncluded: boolean;
	subscriptionPlans: SubscriptionPlan[];
	teacherIds: string[];
	startDate: string;
	endDate: string;
};

const defaultForm = (): FormState => ({
	courseType: '',
	category: '',
	visibility: '',
	pricing: '',
	price: '',
	subscriptionIncluded: false,
	subscriptionPlans: [],
	teacherIds: [],
	startDate: '',
	endDate: '',
});

interface BulkEditModalProps {
	open: boolean;
	courses: ICourse[];
	onClose: () => void;
	onSuccess: () => void;
}

export default function BulkEditModal({ open, courses, onClose, onSuccess }: BulkEditModalProps) {
	// ── Course selection ─────────────────────────────────────────
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
	const [visibilityFilter, setVisibilityFilter] = useState<'All' | 'Public' | 'Private'>('All');
	const [pricingFilter, setPricingFilter] = useState<'All' | 'Free' | 'Paid'>('All');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [courseTypeFilter, setCourseTypeFilter] = useState('');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// ── Reference data ───────────────────────────────────────────
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [refLoading, setRefLoading] = useState(false);

	// ── Tab ──────────────────────────────────────────────────────
	const [tab, setTab] = useState(0);

	// ── Form ─────────────────────────────────────────────────────
	const [form, setForm] = useState<FormState>(defaultForm);
	const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setForm((p) => ({ ...p, [k]: v }));

	// ── Announcement ─────────────────────────────────────────────
	const [ann, setAnn] = useState({ title: '', description: '' });

	// ── Subscription edited flag ─────────────────────────────────
	const [subscriptionEdited, setSubscriptionEdited] = useState(false);

	// ── Submit ───────────────────────────────────────────────────
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;
		setRefLoading(true);
		Promise.all([categoryService.getAll(), courseTypeService.getAll(), teacherService.getAll()])
			.then(([cats, cts, tchs]) => {
				setCategories(cats.data ?? []);
				setCourseTypes(cts.data ?? []);
				setTeachers(tchs.data ?? []);
			})
			.finally(() => setRefLoading(false));
	}, [open]);

	const handleClose = () => {
		setSearch('');
		setStatusFilter('All');
		setVisibilityFilter('All');
		setPricingFilter('All');
		setCategoryFilter('');
		setCourseTypeFilter('');
		setSelectedIds(new Set());
		setTab(0);
		setForm(defaultForm());
		setAnn({ title: '', description: '' });
		setSubscriptionEdited(false);
		onClose();
	};

	// ── Filtered list ────────────────────────────────────────────
	const filtered = courses.filter((c) => {
		if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
		if (statusFilter !== 'All' && c.status !== statusFilter) return false;
		if (visibilityFilter !== 'All' && c.visibility !== visibilityFilter) return false;
		if (pricingFilter !== 'All' && c.pricing !== pricingFilter) return false;
		if (categoryFilter && c.category?._id !== categoryFilter) return false;
		if (courseTypeFilter && c.courseType?._id !== courseTypeFilter) return false;
		return true;
	});

	const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c._id));
	const someSelected = filtered.some((c) => selectedIds.has(c._id));

	const toggleAll = () => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (allSelected) filtered.forEach((c) => next.delete(c._id));
			else filtered.forEach((c) => next.add(c._id));
			return next;
		});
	};

	const toggleOne = (id: string) =>
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	// ── Submit ───────────────────────────────────────────────────
	const handleSubmit = async () => {
		if (selectedIds.size === 0) { toast.error('Select at least one course'); return; }

		// Build updates — only include fields the user actually filled
		const updates: Parameters<typeof courseService.bulkUpdate>[0]['updates'] = {};

		if (form.courseType !== '') updates.courseType = form.courseType || null;
		if (form.category !== '') updates.category = form.category;
		if (form.visibility !== '') updates.visibility = form.visibility;
		if (form.pricing !== '') {
			updates.pricing = form.pricing;
			if (form.pricing === 'Paid') {
				const price = Number(form.price);
				if (!price || price < 0) { toast.error('Enter a valid price'); return; }
				updates.price = price;
			} else {
				updates.price = null;
			}
		}
		if (subscriptionEdited) {
			updates.includedInSubscription = form.subscriptionIncluded;
			updates.allowedSubscriptionPlans = form.subscriptionPlans;
		}
		if (form.teacherIds.length > 0) updates.teachers = form.teacherIds;
		if (form.startDate !== '') updates.startDate = form.startDate || null;
		if (form.endDate !== '') updates.endDate = form.endDate || null;

		const hasUpdates = Object.keys(updates).length > 0;
		const hasAnn = ann.title.trim() && ann.description.trim();

		if (!hasUpdates && !hasAnn) {
			toast.error('Fill in at least one field to update');
			return;
		}
		if (tab === 1 && !hasAnn) {
			toast.error('Announcement title and description are required');
			return;
		}

		const payload: Parameters<typeof courseService.bulkUpdate>[0] = {
			courseIds: Array.from(selectedIds),
			...(hasUpdates ? { updates } : {}),
			...(hasAnn ? { announcement: { title: ann.title.trim(), description: ann.description.trim() } } : {}),
		};

		setSubmitting(true);
		try {
			await courseService.bulkUpdate(payload);
			toast.success(`Updated ${selectedIds.size} course${selectedIds.size !== 1 ? 's' : ''}`);
			onSuccess();
			handleClose();
		} catch {
			// handled by interceptor
		} finally {
			setSubmitting(false);
		}
	};

	const selectedCount = selectedIds.size;

	return (
		<Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth PaperProps={{ sx: { height: '90vh' } }}>
			{/* ── Header ────────────────────────────────────────────── */}
			<DialogTitle sx={{ pb: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Box>
						<Typography variant='h6' sx={{ fontWeight: 700 }}>Bulk Edit Courses</Typography>
						<Typography variant='caption' color='text.secondary'>
							Select courses on the left, then fill in the fields you want to update
						</Typography>
					</Box>
					<IconButton onClick={handleClose} size='small'><CloseIcon /></IconButton>
				</Box>
			</DialogTitle>

			<Divider />

			<DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>

				{/* ── LEFT: course selector ─────────────────────────── */}
				<Box
					sx={{
						width: { xs: '100%', md: '40%' },
						flexShrink: 0,
						display: 'flex',
						flexDirection: 'column',
						borderRight: '1px solid',
						borderColor: 'divider',
					}}
				>
					{/* Search + filters */}
					<Box sx={{ p: 2, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
						<TextField
							size='small'
							fullWidth
							placeholder='Search courses…'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position='start'>
											<SearchIcon fontSize='small' />
										</InputAdornment>
									),
								},
							}}
						/>

						{/* Status */}
						<Box>
							<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Status</Typography>
							<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
								{(['All', 'Published', 'Draft'] as const).map((s) => (
									<Chip key={s} label={s} size='small'
										variant={statusFilter === s ? 'filled' : 'outlined'}
										color={statusFilter === s ? 'primary' : 'default'}
										onClick={() => setStatusFilter(s)} sx={{ cursor: 'pointer' }} />
								))}
							</Box>
						</Box>

						{/* Visibility */}
						<Box>
							<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Visibility</Typography>
							<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
								{(['All', 'Public', 'Private'] as const).map((v) => (
									<Chip key={v} label={v} size='small'
										variant={visibilityFilter === v ? 'filled' : 'outlined'}
										color={visibilityFilter === v ? 'primary' : 'default'}
										onClick={() => setVisibilityFilter(v)} sx={{ cursor: 'pointer' }} />
								))}
							</Box>
						</Box>

						{/* Pricing */}
						<Box>
							<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Pricing</Typography>
							<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
								{(['All', 'Free', 'Paid'] as const).map((p) => (
									<Chip key={p} label={p} size='small'
										variant={pricingFilter === p ? 'filled' : 'outlined'}
										color={pricingFilter === p ? 'primary' : 'default'}
										onClick={() => setPricingFilter(p)} sx={{ cursor: 'pointer' }} />
								))}
							</Box>
						</Box>

						{/* Category + Course Type selects */}
						<Box sx={{ display: 'flex', gap: 1 }}>
							<TextField
								select size='small' sx={{ flex: 1 }}
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								label='Category'
							>
								<MenuItem value=''>All</MenuItem>
								{categories.map((c) => (
									<MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
								))}
							</TextField>
							<TextField
								select size='small' sx={{ flex: 1 }}
								value={courseTypeFilter}
								onChange={(e) => setCourseTypeFilter(e.target.value)}
								label='Course Type'
							>
								<MenuItem value=''>All</MenuItem>
								{courseTypes.map((ct) => (
									<MenuItem key={ct._id} value={ct._id}>{ct.name}</MenuItem>
								))}
							</TextField>
						</Box>
					</Box>

					{/* Select-all bar */}
					<Box
						sx={{
							px: 2,
							py: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							borderTop: '1px solid',
							borderBottom: '1px solid',
							borderColor: 'divider',
							bgcolor: 'grey.50',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={toggleAll}>
							<IconButton size='small' disableRipple>
								{allSelected
									? <CheckBoxIcon color='primary' fontSize='small' />
									: someSelected
										? <IndeterminateCheckBoxIcon color='primary' fontSize='small' />
										: <CheckBoxOutlineBlankIcon fontSize='small' />}
							</IconButton>
							<Typography variant='caption' sx={{ fontWeight: 600 }}>
								{allSelected ? 'Deselect all' : 'Select all'} ({filtered.length})
							</Typography>
						</Box>
						{selectedCount > 0 && (
							<Chip label={`${selectedCount} selected`} size='small' color='primary' sx={{ fontWeight: 700 }} />
						)}
					</Box>

					{/* Course rows */}
					<Box sx={{ flex: 1, overflowY: 'auto' }}>
						{filtered.length === 0 ? (
							<Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
								<SchoolOutlinedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.25 }} />
								<Typography variant='body2'>No courses match</Typography>
							</Box>
						) : (
							filtered.map((course) => {
								const checked = selectedIds.has(course._id);
								return (
									<Box
										key={course._id}
										onClick={() => toggleOne(course._id)}
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 1.5,
											px: 2,
											py: 1.25,
											cursor: 'pointer',
											borderBottom: '1px solid',
											borderColor: 'divider',
											bgcolor: checked ? 'primary.50' : 'transparent',
											transition: 'background 0.12s',
											'&:hover': { bgcolor: checked ? 'primary.100' : 'action.hover' },
										}}
									>
										<Checkbox
											checked={checked}
											size='small'
											sx={{ p: 0, flexShrink: 0 }}
											onClick={(e) => e.stopPropagation()}
											onChange={() => toggleOne(course._id)}
										/>
										<Box
											sx={{
												width: 52,
												height: 36,
												borderRadius: 0.5,
												overflow: 'hidden',
												flexShrink: 0,
												bgcolor: 'grey.200',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{course.coverImage ? (
												<Box
													component='img'
													src={course.coverImage}
													alt=''
													sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
												/>
											) : (
												<SchoolOutlinedIcon sx={{ fontSize: 18, color: 'grey.400' }} />
											)}
										</Box>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												variant='body2'
												sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
											>
												{course.title}
											</Typography>
											<Box sx={{ display: 'flex', gap: 0.5, mt: 0.3, alignItems: 'center' }}>
												<Chip
													label={course.status}
													size='small'
													sx={{
														height: 16,
														fontSize: '0.6rem',
														fontWeight: 700,
														bgcolor: course.status === 'Published' ? '#16a34a' : '#6b7280',
														color: 'white',
													}}
												/>
												{course.courseType && (
													<Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.68rem' }}>
														{course.courseType.name}
													</Typography>
												)}
											</Box>
										</Box>
									</Box>
								);
							})
						)}
					</Box>
				</Box>

				{/* ── RIGHT: update panel ──────────────────────────────── */}
				<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
					<Tabs
						value={tab}
						onChange={(_, v: number) => setTab(v)}
						sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, flexShrink: 0 }}
					>
						<Tab label='Update Fields' sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
						<Tab label='Post Announcement' sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
					</Tabs>

					<Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
						{refLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
								<CircularProgress />
							</Box>
						) : tab === 0 ? (
							/* ── Update Fields ────────────────────────────────── */
							<Paper
								variant='outlined'
								sx={{ borderRadius: 0.5, overflow: 'hidden' }}
							>
								{/* Course Type + Category */}
								<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
									<Box sx={{ display: 'flex', gap: 2 }}>
										<Box sx={{ flex: 1 }}>
											<Field label='Course Type'>
												<TextField
													select
													size='small'
													fullWidth
													value={form.courseType}
													onChange={(e) => set('courseType', e.target.value)}
												>
													<MenuItem value=''>— No change —</MenuItem>
													<MenuItem value='__clear__'><em>Clear course type</em></MenuItem>
													{courseTypes.map((ct) => (
														<MenuItem key={ct._id} value={ct._id}>{ct.name}</MenuItem>
													))}
												</TextField>
											</Field>
										</Box>
										<Box sx={{ flex: 1 }}>
											<Field label='Category'>
												<TextField
													select
													size='small'
													fullWidth
													value={form.category}
													onChange={(e) => set('category', e.target.value)}
												>
													<MenuItem value=''>— No change —</MenuItem>
													{categories.map((c) => (
														<MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
													))}
												</TextField>
											</Field>
										</Box>
									</Box>
								</Box>

								{/* Visibility + Pricing */}
								<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
									<Box sx={{ display: 'flex', gap: 2 }}>
										<Box sx={{ flex: 1 }}>
											<Field label='Visibility'>
												<TextField
													select
													size='small'
													fullWidth
													value={form.visibility}
													onChange={(e) => set('visibility', e.target.value as FormState['visibility'])}
												>
													<MenuItem value=''>— No change —</MenuItem>
													<MenuItem value='Public'>Public</MenuItem>
													<MenuItem value='Private'>Private</MenuItem>
												</TextField>
											</Field>
										</Box>
										<Box sx={{ flex: 1 }}>
											<Field label='Pricing'>
												<TextField
													select
													size='small'
													fullWidth
													value={form.pricing}
													onChange={(e) => set('pricing', e.target.value as FormState['pricing'])}
												>
													<MenuItem value=''>— No change —</MenuItem>
													<MenuItem value='Free'>Free</MenuItem>
													<MenuItem value='Paid'>Paid</MenuItem>
												</TextField>
											</Field>
										</Box>
										{form.pricing === 'Paid' && (
											<Box sx={{ flex: 1 }}>
												<Field label='Price (BDT)'>
													<TextField
														size='small'
														type='number'
														fullWidth
														value={form.price}
														onChange={(e) => set('price', e.target.value)}
														inputProps={{ min: 0 }}
													/>
												</Field>
											</Box>
										)}
									</Box>
								</Box>

								{/* Subscription */}
								<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
									<Field label='Subscription'>
										<FormControlLabel
											control={
												<Switch
													checked={form.subscriptionIncluded}
													onChange={(e) => {
														set('subscriptionIncluded', e.target.checked);
														setSubscriptionEdited(true);
													}}
												/>
											}
											label='Include in Subscription'
										/>
										{form.subscriptionIncluded && (
											<Box sx={{ mt: 0.5 }}>
												<FormLabel sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Allowed plans</FormLabel>
												<FormGroup row sx={{ mt: 0.5 }}>
													{PLANS.map((plan) => (
														<FormControlLabel
															key={plan}
															control={
																<Checkbox
																	size='small'
																	checked={form.subscriptionPlans.includes(plan)}
																	onChange={(e) => {
																		const plans = e.target.checked
																			? [...form.subscriptionPlans, plan]
																			: form.subscriptionPlans.filter((p) => p !== plan);
																		set('subscriptionPlans', plans);
																		setSubscriptionEdited(true);
																	}}
																/>
															}
															label={<Typography variant='caption'>{plan}</Typography>}
														/>
													))}
												</FormGroup>
											</Box>
										)}
									</Field>
								</Box>

								{/* Teachers */}
								<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
									<Field label='Teachers'>
										<TextField
											select
											size='small'
											fullWidth
											value=''
											label='Add teacher'
											onChange={(e) => {
												if (e.target.value && !form.teacherIds.includes(e.target.value))
													set('teacherIds', [...form.teacherIds, e.target.value]);
											}}
											slotProps={{ select: { displayEmpty: true } }}
										>
											<MenuItem value='' disabled>Select to add</MenuItem>
											{teachers.map((t) => (
												<MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
											))}
										</TextField>
										{form.teacherIds.length > 0 && (
											<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
												{form.teacherIds.map((id) => {
													const t = teachers.find((x) => x._id === id);
													return t ? (
														<Chip
															key={id}
															label={t.name}
															size='small'
															onDelete={() => set('teacherIds', form.teacherIds.filter((x) => x !== id))}
														/>
													) : null;
												})}
											</Box>
										)}
									</Field>
								</Box>

								{/* Start Date + End Date */}
								<Box sx={{ p: 2 }}>
									<Box sx={{ display: 'flex', gap: 2 }}>
										<Box sx={{ flex: 1 }}>
											<Field label='Start Date'>
												<TextField
													size='small'
													type='date'
													fullWidth
													value={form.startDate}
													onChange={(e) => set('startDate', e.target.value)}
													slotProps={{ inputLabel: { shrink: true } }}
													helperText='Leave empty for no change'
												/>
											</Field>
										</Box>
										<Box sx={{ flex: 1 }}>
											<Field label='End Date'>
												<TextField
													size='small'
													type='date'
													fullWidth
													value={form.endDate}
													onChange={(e) => set('endDate', e.target.value)}
													slotProps={{ inputLabel: { shrink: true } }}
													inputProps={{ min: form.startDate || undefined }}
													helperText='Leave empty for no change'
												/>
											</Field>
										</Box>
									</Box>
								</Box>
							</Paper>
						) : (
							/* ── Announcement tab ───────────────────────────────── */
							<Paper variant='outlined' sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
								<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
									<Field label='Title'>
										<TextField
											size='small'
											fullWidth
											placeholder='Announcement title…'
											value={ann.title}
											onChange={(e) => setAnn((p) => ({ ...p, title: e.target.value }))}
										/>
									</Field>
								</Box>
								<Box sx={{ p: 2 }}>
									<Field label='Description'>
										<RichTextEditor
											value={ann.description}
											onChange={(html) => setAnn((p) => ({ ...p, description: html }))}
											placeholder='Write your announcement…'
											minHeight={180}
										/>
									</Field>
								</Box>
							</Paper>
						)}
					</Box>
				</Box>
			</DialogContent>

			<Divider />

			{/* ── Footer ─────────────────────────────────────────────── */}
			<DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
				<Box>
					{selectedCount > 0 ? (
						<Tooltip title='Click a course to deselect'>
							<Chip
								label={`${selectedCount} course${selectedCount !== 1 ? 's' : ''} selected`}
								color='primary'
								variant='outlined'
								size='small'
								sx={{ fontWeight: 700 }}
							/>
						</Tooltip>
					) : (
						<Typography variant='caption' color='text.secondary'>No courses selected</Typography>
					)}
				</Box>
				<Box sx={{ display: 'flex', gap: 1.5 }}>
					<Button onClick={handleClose} disabled={submitting}>Cancel</Button>
					<Button
						variant='contained'
						onClick={() => void handleSubmit()}
						disabled={submitting || selectedCount === 0}
						sx={{ minWidth: 150 }}
					>
						{submitting
							? <CircularProgress size={18} color='inherit' />
							: `Apply to ${selectedCount || '…'} course${selectedCount !== 1 ? 's' : ''}`}
					</Button>
				</Box>
			</DialogActions>
		</Dialog>
	);
}
