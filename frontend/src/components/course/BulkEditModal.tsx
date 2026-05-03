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
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import { teacherService } from '../../services/teacher.service';
import type { ICourse, ICategory, ICourseType, ITeacher, SubscriptionPlan } from '../../types/index';

const PLANS: SubscriptionPlan[] = ['Basic', 'Premium', 'Gold', 'Quiz Only'];

// A field toggle row — shows label + switch, renders children only when enabled
function FieldRow({
	label,
	enabled,
	onToggle,
	children,
}: {
	label: string;
	enabled: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<Box sx={{ mb: 2 }}>
			<FormControlLabel
				control={
					<Switch
						size='small'
						checked={enabled}
						onChange={onToggle}
						sx={{ mr: 0.5 }}
					/>
				}
				label={
					<Typography variant='body2' sx={{ fontWeight: 600, color: enabled ? 'text.primary' : 'text.disabled' }}>
						{label}
					</Typography>
				}
			/>
			{enabled && <Box sx={{ mt: 1, pl: 1 }}>{children}</Box>}
		</Box>
	);
}

interface BulkEditModalProps {
	open: boolean;
	courses: ICourse[];
	onClose: () => void;
	onSuccess: () => void;
}

type FieldsState = {
	courseType: { on: boolean; value: string };
	category: { on: boolean; value: string };
	visibility: { on: boolean; value: string };
	pricing: { on: boolean; value: string; price: string };
	subscription: { on: boolean; included: boolean; plans: SubscriptionPlan[] };
	teachers: { on: boolean; ids: string[] };
	startDate: { on: boolean; value: string };
	endDate: { on: boolean; value: string };
};

const defaultFields = (): FieldsState => ({
	courseType: { on: false, value: '' },
	category: { on: false, value: '' },
	visibility: { on: false, value: 'Public' },
	pricing: { on: false, value: 'Free', price: '' },
	subscription: { on: false, included: false, plans: [] },
	teachers: { on: false, ids: [] },
	startDate: { on: false, value: '' },
	endDate: { on: false, value: '' },
});

export default function BulkEditModal({ open, courses, onClose, onSuccess }: BulkEditModalProps) {
	// ── Selection state ──────────────────────────────────────────
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// ── Reference data ───────────────────────────────────────────
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [refLoading, setRefLoading] = useState(false);

	// ── Tab ──────────────────────────────────────────────────────
	const [tab, setTab] = useState(0);

	// ── Fields ───────────────────────────────────────────────────
	const [fields, setFields] = useState<FieldsState>(defaultFields);

	// ── Announcement ─────────────────────────────────────────────
	const [ann, setAnn] = useState({ title: '', description: '' });

	// ── Submit ───────────────────────────────────────────────────
	const [submitting, setSubmitting] = useState(false);

	// Load reference data when modal opens
	useEffect(() => {
		if (!open) return;
		setRefLoading(true);
		Promise.all([
			categoryService.getAll(),
			courseTypeService.getAll(),
			teacherService.getAll(),
		]).then(([cats, cts, tchs]) => {
			setCategories(cats.data ?? []);
			setCourseTypes(cts.data ?? []);
			setTeachers(tchs.data ?? []);
		}).finally(() => setRefLoading(false));
	}, [open]);

	// Reset everything on close
	const handleClose = () => {
		setSearch('');
		setStatusFilter('All');
		setSelectedIds(new Set());
		setTab(0);
		setFields(defaultFields());
		setAnn({ title: '', description: '' });
		onClose();
	};

	// ── Filtered course list ─────────────────────────────────────
	const filtered = courses.filter((c) => {
		const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
		const matchStatus =
			statusFilter === 'All' ||
			(statusFilter === 'Published' && c.status === 'Published') ||
			(statusFilter === 'Draft' && c.status === 'Draft');
		return matchSearch && matchStatus;
	});

	const allFilteredSelected =
		filtered.length > 0 && filtered.every((c) => selectedIds.has(c._id));
	const someFilteredSelected = filtered.some((c) => selectedIds.has(c._id));

	const toggleAll = () => {
		if (allFilteredSelected) {
			setSelectedIds((prev) => {
				const next = new Set(prev);
				filtered.forEach((c) => next.delete(c._id));
				return next;
			});
		} else {
			setSelectedIds((prev) => {
				const next = new Set(prev);
				filtered.forEach((c) => next.add(c._id));
				return next;
			});
		}
	};

	const toggleOne = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const setF = <K extends keyof FieldsState>(key: K, patch: Partial<FieldsState[K]>) =>
		setFields((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

	// ── Submit ───────────────────────────────────────────────────
	const handleSubmit = async () => {
		if (selectedIds.size === 0) {
			toast.error('Select at least one course');
			return;
		}

		const hasFieldUpdate = Object.values(fields).some((f) => f.on);
		const hasAnnouncement = ann.title.trim() && ann.description.trim();

		if (!hasFieldUpdate && !hasAnnouncement) {
			toast.error('Enable at least one field to update or add an announcement');
			return;
		}

		if (tab === 1 && (!ann.title.trim() || !ann.description.trim())) {
			toast.error('Announcement title and description are required');
			return;
		}

		// Build updates object — only include enabled fields
		const updates: Parameters<typeof courseService.bulkUpdate>[0]['updates'] = {};

		if (fields.courseType.on) updates.courseType = fields.courseType.value || null;
		if (fields.category.on && fields.category.value) updates.category = fields.category.value;
		if (fields.visibility.on) updates.visibility = fields.visibility.value;
		if (fields.pricing.on) {
			updates.pricing = fields.pricing.value;
			if (fields.pricing.value === 'Paid') {
				const price = Number(fields.pricing.price);
				if (!price || price < 0) { toast.error('Enter a valid price'); return; }
				updates.price = price;
			} else {
				updates.price = null;
			}
		}
		if (fields.subscription.on) {
			updates.includedInSubscription = fields.subscription.included;
			updates.allowedSubscriptionPlans = fields.subscription.plans;
		}
		if (fields.teachers.on) updates.teachers = fields.teachers.ids;
		if (fields.startDate.on) updates.startDate = fields.startDate.value || null;
		if (fields.endDate.on) updates.endDate = fields.endDate.value || null;

		const payload: Parameters<typeof courseService.bulkUpdate>[0] = {
			courseIds: Array.from(selectedIds),
			...(Object.keys(updates).length > 0 ? { updates } : {}),
			...(ann.title.trim() && ann.description.trim()
				? { announcement: { title: ann.title.trim(), description: ann.description.trim() } }
				: {}),
		};

		setSubmitting(true);
		try {
			await courseService.bulkUpdate(payload);
			toast.success(`Updated ${selectedIds.size} course${selectedIds.size !== 1 ? 's' : ''}`);
			onSuccess();
			handleClose();
		} catch {
			// error handled by interceptor
		} finally {
			setSubmitting(false);
		}
	};

	const selectedCount = selectedIds.size;

	return (
		<Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth PaperProps={{ sx: { height: '90vh' } }}>
			<DialogTitle sx={{ pb: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Box>
						<Typography variant='h6' sx={{ fontWeight: 700 }}>
							Bulk Edit Courses
						</Typography>
						<Typography variant='caption' color='text.secondary'>
							Select courses then choose what to update
						</Typography>
					</Box>
					<IconButton onClick={handleClose} size='small'>
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>

			<Divider />

			<DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
				{/* ── LEFT: course list ────────────────────────────────── */}
				<Box
					sx={{
						width: { xs: '100%', md: '42%' },
						display: 'flex',
						flexDirection: 'column',
						borderRight: '1px solid',
						borderColor: 'divider',
						flexShrink: 0,
					}}
				>
					{/* Search + filter */}
					<Box sx={{ p: 2, pb: 1 }}>
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
							sx={{ mb: 1.5 }}
						/>
						<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
							{(['All', 'Published', 'Draft'] as const).map((s) => (
								<Chip
									key={s}
									label={s}
									size='small'
									variant={statusFilter === s ? 'filled' : 'outlined'}
									color={statusFilter === s ? 'primary' : 'default'}
									onClick={() => setStatusFilter(s)}
									sx={{ cursor: 'pointer' }}
								/>
							))}
						</Box>
					</Box>

					{/* Select-all row */}
					<Box
						sx={{
							px: 2,
							py: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							borderBottom: '1px solid',
							borderColor: 'divider',
							bgcolor: 'grey.50',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<IconButton size='small' onClick={toggleAll}>
								{allFilteredSelected ? (
									<CheckBoxIcon color='primary' fontSize='small' />
								) : someFilteredSelected ? (
									<IndeterminateCheckBoxIcon color='primary' fontSize='small' />
								) : (
									<CheckBoxOutlineBlankIcon fontSize='small' />
								)}
							</IconButton>
							<Typography variant='caption' sx={{ fontWeight: 600 }}>
								{allFilteredSelected ? 'Deselect all' : 'Select all'} ({filtered.length})
							</Typography>
						</Box>
						{selectedCount > 0 && (
							<Chip
								label={`${selectedCount} selected`}
								size='small'
								color='primary'
								sx={{ fontWeight: 700 }}
							/>
						)}
					</Box>

					{/* Course list */}
					<Box sx={{ flex: 1, overflowY: 'auto' }}>
						{filtered.length === 0 ? (
							<Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
								<SchoolOutlinedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
								<Typography variant='body2'>No courses match your filter</Typography>
							</Box>
						) : (
							filtered.map((course) => {
								const selected = selectedIds.has(course._id);
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
											bgcolor: selected ? 'primary.50' : 'transparent',
											transition: 'background 0.15s',
											'&:hover': { bgcolor: selected ? 'primary.100' : 'action.hover' },
										}}
									>
										<Checkbox
											checked={selected}
											size='small'
											sx={{ p: 0, flexShrink: 0 }}
											onClick={(e) => e.stopPropagation()}
											onChange={() => toggleOne(course._id)}
										/>
										{/* Thumbnail */}
										<Box
											sx={{
												width: 52,
												height: 36,
												borderRadius: 0.75,
												overflow: 'hidden',
												flexShrink: 0,
												bgcolor: 'grey.200',
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
												<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
													<SchoolOutlinedIcon sx={{ fontSize: 18, color: 'grey.400' }} />
												</Box>
											)}
										</Box>
										{/* Info */}
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												variant='body2'
												sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
											>
												{course.title}
											</Typography>
											<Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, alignItems: 'center' }}>
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

					<Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
						{refLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
								<CircularProgress />
							</Box>
						) : tab === 0 ? (
							/* ── Update Fields tab ──────────────────────────── */
							<Box>
								<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
									Toggle a field ON to include it in the bulk update. Only enabled fields are changed.
								</Typography>

								<FieldRow label='Course Type' enabled={fields.courseType.on} onToggle={() => setF('courseType', { on: !fields.courseType.on })}>
									<TextField
										select
										size='small'
										fullWidth
										value={fields.courseType.value}
										onChange={(e) => setF('courseType', { value: e.target.value })}
										label='Course Type'
									>
										<MenuItem value=''>— Clear course type —</MenuItem>
										{courseTypes.map((ct) => (
											<MenuItem key={ct._id} value={ct._id}>{ct.name}</MenuItem>
										))}
									</TextField>
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='Category' enabled={fields.category.on} onToggle={() => setF('category', { on: !fields.category.on })}>
									<TextField
										select
										size='small'
										fullWidth
										value={fields.category.value}
										onChange={(e) => setF('category', { value: e.target.value })}
										label='Category'
									>
										{categories.map((c) => (
											<MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
										))}
									</TextField>
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='Visibility' enabled={fields.visibility.on} onToggle={() => setF('visibility', { on: !fields.visibility.on })}>
									<Box sx={{ display: 'flex', gap: 1 }}>
										{['Public', 'Private'].map((v) => (
											<Button
												key={v}
												size='small'
												variant={fields.visibility.value === v ? 'contained' : 'outlined'}
												onClick={() => setF('visibility', { value: v })}
												sx={{ flex: 1 }}
											>
												{v}
											</Button>
										))}
									</Box>
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='Pricing' enabled={fields.pricing.on} onToggle={() => setF('pricing', { on: !fields.pricing.on })}>
									<Box sx={{ display: 'flex', gap: 1, mb: fields.pricing.value === 'Paid' ? 1.5 : 0 }}>
										{['Free', 'Paid'].map((v) => (
											<Button
												key={v}
												size='small'
												variant={fields.pricing.value === v ? 'contained' : 'outlined'}
												onClick={() => setF('pricing', { value: v })}
												sx={{ flex: 1 }}
											>
												{v}
											</Button>
										))}
									</Box>
									{fields.pricing.value === 'Paid' && (
										<TextField
											size='small'
											type='number'
											fullWidth
											label='Price (BDT)'
											value={fields.pricing.price}
											onChange={(e) => setF('pricing', { price: e.target.value })}
											inputProps={{ min: 0 }}
										/>
									)}
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='Subscription' enabled={fields.subscription.on} onToggle={() => setF('subscription', { on: !fields.subscription.on })}>
									<FormControlLabel
										control={
											<Switch
												size='small'
												checked={fields.subscription.included}
												onChange={(e) => setF('subscription', { included: e.target.checked })}
											/>
										}
										label={<Typography variant='body2'>Include in subscription</Typography>}
									/>
									{fields.subscription.included && (
										<Box sx={{ mt: 1 }}>
											<FormLabel sx={{ fontSize: '0.8rem' }}>Allowed plans</FormLabel>
											<FormGroup row sx={{ mt: 0.5 }}>
												{PLANS.map((plan) => (
													<FormControlLabel
														key={plan}
														control={
															<Checkbox
																size='small'
																checked={fields.subscription.plans.includes(plan)}
																onChange={(e) => {
																	const plans = e.target.checked
																		? [...fields.subscription.plans, plan]
																		: fields.subscription.plans.filter((p) => p !== plan);
																	setF('subscription', { plans });
																}}
															/>
														}
														label={<Typography variant='caption'>{plan}</Typography>}
													/>
												))}
											</FormGroup>
										</Box>
									)}
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='Teachers' enabled={fields.teachers.on} onToggle={() => setF('teachers', { on: !fields.teachers.on })}>
									<TextField
										select
										size='small'
										fullWidth
										value=''
										label='Add teacher'
										onChange={(e) => {
											if (!fields.teachers.ids.includes(e.target.value))
												setF('teachers', { ids: [...fields.teachers.ids, e.target.value] });
										}}
										slotProps={{ select: { displayEmpty: true } }}
									>
										<MenuItem value='' disabled>Select to add</MenuItem>
										{teachers.map((t) => (
											<MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
										))}
									</TextField>
									<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
										{fields.teachers.ids.map((id) => {
											const t = teachers.find((x) => x._id === id);
											return t ? (
												<Chip
													key={id}
													label={t.name}
													size='small'
													onDelete={() => setF('teachers', { ids: fields.teachers.ids.filter((x) => x !== id) })}
												/>
											) : null;
										})}
									</Box>
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='Start Date' enabled={fields.startDate.on} onToggle={() => setF('startDate', { on: !fields.startDate.on })}>
									<TextField
										size='small'
										type='date'
										fullWidth
										value={fields.startDate.value}
										onChange={(e) => setF('startDate', { value: e.target.value })}
										slotProps={{ inputLabel: { shrink: true } }}
										helperText='Leave empty to clear the date'
									/>
								</FieldRow>

								<Divider sx={{ my: 1 }} />

								<FieldRow label='End Date' enabled={fields.endDate.on} onToggle={() => setF('endDate', { on: !fields.endDate.on })}>
									<TextField
										size='small'
										type='date'
										fullWidth
										value={fields.endDate.value}
										onChange={(e) => setF('endDate', { value: e.target.value })}
										slotProps={{ inputLabel: { shrink: true } }}
										inputProps={{ min: fields.startDate.on ? fields.startDate.value : undefined }}
										helperText='Leave empty to clear the date'
									/>
								</FieldRow>
							</Box>
						) : (
							/* ── Announcement tab ───────────────────────────── */
							<Box>
								<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
									This announcement will be posted to all selected courses.
								</Typography>
								<TextField
									label='Title *'
									fullWidth
									value={ann.title}
									onChange={(e) => setAnn((p) => ({ ...p, title: e.target.value }))}
									sx={{ mb: 2 }}
								/>
								<TextField
									label='Description *'
									fullWidth
									multiline
									rows={5}
									value={ann.description}
									onChange={(e) => setAnn((p) => ({ ...p, description: e.target.value }))}
								/>
							</Box>
						)}
					</Box>
				</Box>
			</DialogContent>

			<Divider />

			<DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					{selectedCount > 0 ? (
						<Tooltip title='Click a course in the list to deselect'>
							<Chip
								label={`${selectedCount} course${selectedCount !== 1 ? 's' : ''} selected`}
								color='primary'
								variant='outlined'
								size='small'
								sx={{ fontWeight: 700 }}
							/>
						</Tooltip>
					) : (
						<Typography variant='caption' color='text.secondary'>
							No courses selected
						</Typography>
					)}
				</Box>
				<Box sx={{ display: 'flex', gap: 1.5 }}>
					<Button onClick={handleClose} disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant='contained'
						onClick={() => void handleSubmit()}
						disabled={submitting || selectedCount === 0}
						sx={{ minWidth: 140 }}
					>
						{submitting ? (
							<CircularProgress size={18} color='inherit' />
						) : (
							`Apply to ${selectedCount || '…'} course${selectedCount !== 1 ? 's' : ''}`
						)}
					</Button>
				</Box>
			</DialogActions>
		</Dialog>
	);
}
