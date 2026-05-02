import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Button,
	TextField,
	Typography,
	MenuItem,
	FormControlLabel,
	Switch,
	Checkbox,
	FormGroup,
	FormLabel,
	CircularProgress,
	Chip,
	Divider,
	IconButton,
	Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { teacherService } from '../../services/teacher.service';
import { announcementService } from '../../services/announcement.service';
import RichTextEditor from '../../components/course/RichTextEditor';
import CurriculumBuilder from '../../components/course/CurriculumBuilder/CurriculumBuilder';
import type { ICategory, ITeacher, IAnnouncement, SubscriptionPlan } from '../../types/index';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
	'Basic',
	'Premium',
	'Gold',
	'Quiz Only',
];

function ArrayFieldEditor({
	label,
	values,
	onChange,
}: {
	label: string;
	values: string[];
	onChange: (v: string[]) => void;
}) {
	const [newValue, setNewValue] = useState('');

	const add = () => {
		const trimmed = newValue.trim();
		if (!trimmed) return;
		onChange([...values, trimmed]);
		setNewValue('');
	};

	const updateItem = (index: number, value: string) => {
		onChange(values.map((item, idx) => (idx === index ? value : item)));
	};

	const removeItem = (index: number) => {
		onChange(values.filter((_, idx) => idx !== index));
	};

	return (
		<Box>
			<Typography variant='body2' sx={{ fontWeight: 600, mb: 2 }}>
				{label}
			</Typography>

			<Box
				sx={{
					display: 'flex',
					gap: 1,
					alignItems: 'center',
					mb: 2,
					'&:hover .addButton': { opacity: 1 },
				}}
			>
				<TextField
					size='small'
					value={newValue}
					onChange={(e) => setNewValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							add();
						}
					}}
					placeholder={`Add ${label.toLowerCase()} item...`}
					fullWidth
				/>
				<IconButton
					className='addButton'
					color='primary'
					size='small'
					onClick={add}
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						opacity: 0,
						transition: 'opacity 0.2s ease-in-out',
					}}
				>
					<AddIcon fontSize='small' />
				</IconButton>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
				{values.map((value, idx) => (
					<Box
						key={idx}
						sx={{
							display: 'flex',
							gap: 1,
							alignItems: 'center',
							'&:hover .deleteButton': {
								opacity: 1,
							},
						}}
					>
						<TextField
							fullWidth
							size='small'
							value={value}
							onChange={(e) => updateItem(idx, e.target.value)}
							placeholder={`${label} ${idx + 1}`}
						/>
						<IconButton
							className='deleteButton'
							size='small'
							onClick={() => removeItem(idx)}
							sx={{
								opacity: 0,
								transition: 'opacity 0.2s ease-in-out',
							}}
						>
							<CloseIcon fontSize='small' />
						</IconButton>
					</Box>
				))}
			</Box>
		</Box>
	);
}

export default function CourseCreatePage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);
	const [tab, setTab] = useState(0);
	const [courseId, setCourseId] = useState(id ?? '');
	const [saving, setSaving] = useState(false);
	const [autoSaving, setAutoSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState('');
	const [loadingCourse, setLoadingCourse] = useState(false);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
	const [annForm, setAnnForm] = useState({ title: '', description: '' });
	const [annPosting, setAnnPosting] = useState(false);
	const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const initialRender = useRef(true);
	const autoCreating = useRef(false);

	const [form, setForm] = useState({
		title: '',
		subtitle: '',
		category: '',
		selectedTeachers: [] as string[],
		description: '',
		coverImage: null as File | null,
		coverPreview: '',
		visibility: 'Private',
		pricing: 'Free',
		price: '',
		includedInSubscription: false,
		allowedSubscriptionPlans: [] as SubscriptionPlan[],
		whatYouWillLearn: [] as string[],
		whatYouWillGet: [] as string[],
		requirements: [] as string[],
	});

	useEffect(() => {
		Promise.all([categoryService.getAll(), teacherService.getAll()]).then(
			([catRes, tchRes]) => {
				const cats = catRes.data ?? [];
				setCategories(cats);
				setTeachers(tchRes.data ?? []);

				// Auto-create draft for new courses
				if (!id && !autoCreating.current) {
					autoCreating.current = true;
					const firstCat = cats[0]?._id ?? '';
					const fd = new FormData();
					fd.append('title', 'Untitled Course');
					if (firstCat) fd.append('category', firstCat);
					fd.append('visibility', 'Private');
					fd.append('pricing', 'Free');
					fd.append('includedInSubscription', 'false');
					fd.append('teachers', JSON.stringify([]));
					fd.append('allowedSubscriptionPlans', JSON.stringify([]));
					fd.append('whatYouWillLearn', JSON.stringify([]));
					fd.append('whatYouWillGet', JSON.stringify([]));
					fd.append('requirements', JSON.stringify([]));
					courseService.create(fd).then(async (res) => {
						const newId = res.data?._id as string | undefined;
						if (!newId) return;
						setCourseId(newId);
						if (firstCat) setForm((f) => ({ ...f, category: firstCat }));
						navigate(`/admin/courses/${newId}/edit`, { replace: true });
						// Auto-add Introduction section + Course Introduction lecture
						try {
							const secRes = await courseService.addSection(newId, 'Introduction');
							const sectionId = (secRes.data as { _id: string })?._id;
							if (sectionId) {
								await courseService.addLecture(newId, sectionId, {
									title: 'Course Introduction',
									isPreview: true,
								});
							}
						} catch { /* non-fatal */ }
					}).catch(() => {});
				}
			}
		);
	}, [id]);

	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((p) => ({ ...p, [key]: value }));

	const buildFormData = () => {
		const fd = new FormData();
		fd.append('title', form.title);
		fd.append('subtitle', form.subtitle);
		fd.append('category', form.category);
		fd.append('description', form.description);
		fd.append('visibility', form.visibility);
		fd.append('pricing', form.pricing);
		if (form.price) fd.append('price', form.price);
		fd.append('includedInSubscription', String(form.includedInSubscription));
		fd.append('teachers', JSON.stringify(form.selectedTeachers));
		fd.append(
			'allowedSubscriptionPlans',
			JSON.stringify(form.allowedSubscriptionPlans),
		);
		fd.append('whatYouWillLearn', JSON.stringify(form.whatYouWillLearn));
		fd.append('whatYouWillGet', JSON.stringify(form.whatYouWillGet));
		fd.append('requirements', JSON.stringify(form.requirements));
		if (form.coverImage) fd.append('coverImage', form.coverImage);
		return fd;
	};

	const persistCourse = async (status?: 'Draft' | 'Published') => {
		const showToast = Boolean(status);

		if (showToast && !form.category) {
			toast.error('Please select a category before publishing');
			return null;
		}

		// Use "Untitled Course" as default title
		const effectiveTitle = form.title.trim() || 'Untitled Course';
		const fd = buildFormData();
		// Override title in fd if empty
		if (!form.title.trim()) fd.set('title', effectiveTitle);

		let savedId = courseId;

		if (!savedId) {
			const res = await courseService.create(fd);
			savedId = res.data?._id as string;
			setCourseId(savedId);
			navigate(`/admin/courses/${savedId}/edit`, { replace: true });
			if (showToast) toast.success('Course draft created');
		} else {
			await courseService.update(savedId, fd);
			if (showToast) toast.success('Course updated');
		}

		if (status) {
			await courseService.updateStatus(savedId, status);
		}

		setLastSaved(new Date().toLocaleTimeString());
		return savedId;
	};

	const handleSave = async (status?: 'Draft' | 'Published') => {
		if (status === 'Published' && !form.category) {
			toast.error('Please select a category before publishing');
			return;
		}
		setSaving(true);
		try {
			const savedId = await persistCourse(status);
			if (status === 'Published' && savedId) {
				navigate('/admin/courses');
			}
		} finally {
			setSaving(false);
		}
	};

	const tabs = ['Basic Info', 'Media', 'Learning Content', 'Curriculum', 'Announcements'];

	useEffect(() => {
		if (tab === 4 && courseId) {
			announcementService
				.getByCourse(courseId)
				.then((r) => setAnnouncements(r.data ?? []))
				.catch(() => {});
		}
	}, [tab, courseId]);

	const handlePostAnnouncement = async () => {
		if (!annForm.title.trim() || !annForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		if (!courseId) { toast.error('Save the course first'); return; }
		setAnnPosting(true);
		try {
			const res = await announcementService.create(courseId, annForm);
			if (res.data) setAnnouncements((p) => [res.data!, ...p]);
			setAnnForm({ title: '', description: '' });
			toast.success('Announcement posted');
		} catch {
			// handled by interceptor
		} finally {
			setAnnPosting(false);
		}
	};

	const handleDeleteAnnouncement = async (annId: string) => {
		if (!confirm('Delete this announcement?')) return;
		try {
			await announcementService.delete(annId);
			setAnnouncements((p) => p.filter((a) => a._id !== annId));
			toast.success('Announcement deleted');
		} catch {
			// handled by interceptor
		}
	};

	useEffect(() => {
		if (!id) return;
		setLoadingCourse(true);
		courseService
			.getById(id)
			.then((r) => {
				const data = r.data;
				if (!data) return;
				setCourseId(data._id);
				setForm({
					title: data.title || '',
					subtitle: data.subtitle || '',
					category: data.category?._id || '',
					selectedTeachers: data.teachers?.map((t) => t._id) ?? [],
					description: data.description || '',
					coverImage: null,
					coverPreview: data.coverImage || '',
					visibility: data.visibility || 'Private',
					pricing: data.pricing || 'Free',
					price: data.price?.toString() || '',
					includedInSubscription: data.includedInSubscription ?? false,
					allowedSubscriptionPlans: data.allowedSubscriptionPlans ?? [],
					whatYouWillLearn: data.whatYouWillLearn ?? [],
					whatYouWillGet: data.whatYouWillGet ?? [],
					requirements: data.requirements ?? [],
				});
			})
			.finally(() => setLoadingCourse(false));
	}, [id]);

	useEffect(() => {
		if (initialRender.current) {
			initialRender.current = false;
			return;
		}

		if (!courseId) return; // wait until course exists before auto-saving updates
		if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
		autosaveTimer.current = setTimeout(async () => {
			setAutoSaving(true);
			try {
				await persistCourse();
			} catch (error) {
				console.error('Auto-save failed', error);
			} finally {
				setAutoSaving(false);
			}
		}, 1200);

		return () => {
			if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
		};
	}, [form, courseId]);

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 3,
				}}
			>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					{isEdit ? 'Edit Course' : 'Create Course'}
				</Typography>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button
						variant='outlined'
						onClick={() => void handleSave('Draft')}
						disabled={saving}
					>
						{saving ? <CircularProgress size={18} /> : 'Save Draft'}
					</Button>
					<Button
						variant='contained'
						onClick={() => void handleSave('Published')}
						disabled={saving}
					>
						Publish
					</Button>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', md: 'row' },
					gap: 4,
				}}
			>
				<Box sx={{ width: '100%', maxWidth: { md: 320 } }}>
					<Paper
						variant='outlined'
						sx={{
							position: { md: 'sticky' },
							top: 90,
							p: 2,
							borderRadius: 3,
						}}
					>
						<Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 2 }}>
							Course editor
						</Typography>
						<Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
							Use the editor menu to jump between sections and update your
							course details.
						</Typography>
						<Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
							{tabs.map((label, index) => (
								<Button
									key={label}
									variant={tab === index ? 'contained' : 'outlined'}
									size='small'
									onClick={() => setTab(index)}
									fullWidth
								>
									{label}
								</Button>
							))}
						</Box>
						<Typography variant='caption' sx={{ display: 'block', mb: 1 }}>
							{autoSaving
								? 'Auto saving...'
								: lastSaved
									? `Last saved ${lastSaved}`
									: 'No changes saved yet.'}
						</Typography>
						{loadingCourse && (
							<Box
								sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
							>
								<CircularProgress size={16} />
								<Typography variant='body2'>Loading course...</Typography>
							</Box>
						)}
					</Paper>
				</Box>

				<Box sx={{ flex: 1, width: '100%' }}>
					{/* Tab 0 – Basic Info */}
					{tab === 0 && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: 3,
								maxWidth: 720,
							}}
						>
							<TextField
								label='Course Title *'
								value={form.title}
								onChange={(e) => set('title', e.target.value)}
								fullWidth
							/>
							<TextField
								label='Subtitle'
								value={form.subtitle}
								onChange={(e) => set('subtitle', e.target.value)}
								fullWidth
							/>
							<TextField
								label='Category *'
								select
								value={form.category}
								onChange={(e) => set('category', e.target.value)}
								fullWidth
							>
								{categories.map((c) => (
									<MenuItem key={c._id} value={c._id}>
										{c.name}
									</MenuItem>
								))}
							</TextField>

							<TextField
								label='Teachers'
								select
								value=''
								onChange={(e) => {
									if (!form.selectedTeachers.includes(e.target.value))
										set('selectedTeachers', [
											...form.selectedTeachers,
											e.target.value,
										]);
								}}
								fullWidth
								slotProps={{ select: { displayEmpty: true } }}
							>
								<MenuItem value='' disabled>
									Select a teacher to add
								</MenuItem>
								{teachers.map((t) => (
									<MenuItem key={t._id} value={t._id}>
										{t.name}
									</MenuItem>
								))}
							</TextField>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
								{form.selectedTeachers.map((tid) => {
									const t = teachers.find((x) => x._id === tid);
									return t ? (
										<Chip
											key={tid}
											label={t.name}
											size='small'
											onDelete={() =>
												set(
													'selectedTeachers',
													form.selectedTeachers.filter((x) => x !== tid),
												)
											}
										/>
									) : null;
								})}
							</Box>

							<Box sx={{ display: 'flex', gap: 2 }}>
								<TextField
									label='Visibility'
									select
									value={form.visibility}
									onChange={(e) => set('visibility', e.target.value)}
									sx={{ flex: 1 }}
								>
									<MenuItem value='Public'>Public</MenuItem>
									<MenuItem value='Private'>Private</MenuItem>
								</TextField>
								<TextField
									label='Pricing'
									select
									value={form.pricing}
									onChange={(e) => set('pricing', e.target.value)}
									sx={{ flex: 1 }}
								>
									<MenuItem value='Free'>Free</MenuItem>
									<MenuItem value='Paid'>Paid</MenuItem>
								</TextField>
								{form.pricing === 'Paid' && (
									<TextField
										label='Price (BDT)'
										type='number'
										value={form.price}
										onChange={(e) => set('price', e.target.value)}
										sx={{ flex: 1 }}
									/>
								)}
							</Box>

							<Box>
								<FormControlLabel
									control={
										<Switch
											checked={form.includedInSubscription}
											onChange={(e) =>
												set('includedInSubscription', e.target.checked)
											}
										/>
									}
									label='Included in Subscription'
								/>
								{form.includedInSubscription && (
									<Box sx={{ mt: 1 }}>
										<FormLabel>Allowed Subscription Plans</FormLabel>
										<FormGroup row>
											{SUBSCRIPTION_PLANS.map((plan) => (
												<FormControlLabel
													key={plan}
													control={
														<Checkbox
															checked={form.allowedSubscriptionPlans.includes(
																plan,
															)}
															onChange={(e) =>
																set(
																	'allowedSubscriptionPlans',
																	e.target.checked
																		? [...form.allowedSubscriptionPlans, plan]
																		: form.allowedSubscriptionPlans.filter(
																				(p) => p !== plan,
																			),
																)
															}
														/>
													}
													label={plan}
												/>
											))}
										</FormGroup>
									</Box>
								)}
							</Box>
						</Box>
					)}

					{/* Tab 1 – Media */}
					{tab === 1 && (
						<Box sx={{ maxWidth: 720 }}>
							<Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
								Cover Image
							</Typography>
							<Paper
								variant='outlined'
								sx={{
									p: 4,
									textAlign: 'center',
									borderRadius: 3,
									borderStyle: 'dashed',
									cursor: 'pointer',
									position: 'relative',
									'&:hover': { borderColor: 'primary.main' },
								}}
								onClick={() => document.getElementById('cover-upload')?.click()}
							>
								{form.coverPreview ? (
									<>
										<img
											src={form.coverPreview}
											alt='cover'
											style={{
												maxHeight: 280,
												maxWidth: '100%',
												borderRadius: 8,
											}}
										/>
										<IconButton
											size='small'
											sx={{
												position: 'absolute',
												top: 8,
												right: 8,
												bgcolor: 'background.paper',
											}}
											onClick={(e) => {
												e.stopPropagation();
												set('coverImage', null);
												set('coverPreview', '');
											}}
										>
											<CloseIcon fontSize='small' />
										</IconButton>
									</>
								) : (
									<Box>
										<CloudUploadIcon
											sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
										/>
										<Typography color='text.secondary'>
											Click to upload cover image (max 5MB)
										</Typography>
									</Box>
								)}
								<input
									id='cover-upload'
									type='file'
									accept='image/*'
									hidden
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											set('coverImage', file);
											set('coverPreview', URL.createObjectURL(file));
										}
									}}
								/>
							</Paper>
						</Box>
					)}

					{/* Tab 2 – Learning Content */}
					{tab === 2 && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								maxWidth: 720,
							}}
						>
							<Box>
								<Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
									Description
								</Typography>
								<RichTextEditor
									value={form.description}
									onChange={(html) => set('description', html)}
									placeholder='Describe what this course is about...'
									minHeight={200}
								/>
							</Box>
							<ArrayFieldEditor
								label='What students will learn'
								values={form.whatYouWillLearn}
								onChange={(v) => set('whatYouWillLearn', v)}
							/>
							<ArrayFieldEditor
								label='What students will get'
								values={form.whatYouWillGet}
								onChange={(v) => set('whatYouWillGet', v)}
							/>
							<ArrayFieldEditor
								label='Requirements'
								values={form.requirements}
								onChange={(v) => set('requirements', v)}
							/>
						</Box>
					)}

					{/* Tab 3 – Curriculum */}
					{tab === 3 && (
						courseId ? (
							<CurriculumBuilder courseId={courseId} />
						) : (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
								<CircularProgress />
							</Box>
						)
					)}

					{/* Tab 4 – Announcements */}
					{tab === 4 && (
						<Box sx={{ maxWidth: 720 }}>
							<Typography variant='h6' sx={{ fontWeight: 700, mb: 3 }}>
								Announcements
							</Typography>

							{/* Post form */}
							<Paper variant='outlined' sx={{ p: 2.5, mb: 4, borderRadius: 2 }}>
								<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
									New Announcement
								</Typography>
								<TextField
									label='Title'
									value={annForm.title}
									onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
									fullWidth
									size='small'
									sx={{ mb: 1.5 }}
								/>
								<TextField
									label='Description'
									value={annForm.description}
									onChange={(e) => setAnnForm((p) => ({ ...p, description: e.target.value }))}
									fullWidth
									multiline
									rows={3}
									size='small'
									sx={{ mb: 1.5 }}
								/>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
									<Button
										variant='contained'
										startIcon={<AddIcon />}
										onClick={() => void handlePostAnnouncement()}
										disabled={annPosting || !courseId}
									>
										{annPosting ? <CircularProgress size={16} /> : 'Post'}
									</Button>
								</Box>
							</Paper>

							<Divider sx={{ mb: 3 }} />

							{/* Existing announcements */}
							{announcements.length === 0 ? (
								<Typography color='text.secondary'>No announcements yet.</Typography>
							) : (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{announcements.map((ann) => (
										<Paper key={ann._id} variant='outlined' sx={{ p: 2.5, borderRadius: 2 }}>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
												<Box sx={{ flex: 1 }}>
													<Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 0.5 }}>
														{ann.title}
													</Typography>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
														<Avatar
															src={ann.postedBy.avatar}
															sx={{ width: 22, height: 22, fontSize: 12, bgcolor: 'primary.main' }}
														>
															{ann.postedBy.name[0]}
														</Avatar>
														<Typography variant='caption' color='text.secondary'>
															{ann.postedBy.name} &bull; {ann.postedBy.role} &bull;{' '}
															{new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
														</Typography>
													</Box>
													<Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
														{ann.description}
													</Typography>
												</Box>
												<IconButton
													size='small'
													color='error'
													onClick={() => void handleDeleteAnnouncement(ann._id)}
													sx={{ ml: 1, flexShrink: 0 }}
												>
													<DeleteIcon fontSize='small' />
												</IconButton>
											</Box>
										</Paper>
									))}
								</Box>
							)}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
}
