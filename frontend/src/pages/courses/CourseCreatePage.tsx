import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	Tab,
	Tabs,
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
	IconButton,
	Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { teacherService } from '../../services/teacher.service';
import RichTextEditor from '../../components/course/RichTextEditor';
import CurriculumBuilder from '../../components/course/CurriculumBuilder/CurriculumBuilder';
import type { ICategory, ITeacher, SubscriptionPlan } from '../../types/index';

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
	const [input, setInput] = useState('');
	const add = () => {
		if (!input.trim()) return;
		onChange([...values, input.trim()]);
		setInput('');
	};
	return (
		<Box>
			<Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
				{label}
			</Typography>
			<Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
				<TextField
					size='small'
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							add();
						}
					}}
					placeholder={`Add ${label.toLowerCase()}...`}
					sx={{ flex: 1 }}
				/>
				<Button
					variant='outlined'
					size='small'
					startIcon={<AddIcon />}
					onClick={add}
				>
					Add
				</Button>
			</Box>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
				{values.map((v, i) => (
					<Chip
						key={i}
						label={v}
						size='small'
						onDelete={() => onChange(values.filter((_, idx) => idx !== i))}
					/>
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
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);

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
		void categoryService.getAll().then((r) => setCategories(r.data ?? []));
		void teacherService.getAll().then((r) => setTeachers(r.data ?? []));
	}, []);

	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((p) => ({ ...p, [key]: value }));

	const handleSave = async (status?: 'Draft' | 'Published') => {
		if (!form.title || !form.category) {
			toast.error('Title and category are required');
			return;
		}
		setSaving(true);

		try {
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

			let savedId = courseId;
			if (!savedId) {
				const res = await courseService.create(fd);
				savedId = (res.data as { _id: string })._id;
				setCourseId(savedId);
				toast.success('Course created');
			} else {
				await courseService.update(savedId, fd);
				toast.success('Course updated');
			}

			if (status) {
				await courseService.updateStatus(savedId, status);
				toast.success(
					`Course ${status === 'Published' ? 'published' : 'saved as draft'}`,
				);
			}

			if (status === 'Published') navigate('/admin/courses');
		} finally {
			setSaving(false);
		}
	};

	const tabs = ['Basic Info', 'Media', 'Learning Content', 'Curriculum'];

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

			<Tabs
				value={tab}
				onChange={(_, v: number) => setTab(v)}
				sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
			>
				{tabs.map((label) => (
					<Tab key={label} label={label} />
				))}
			</Tabs>

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
													checked={form.allowedSubscriptionPlans.includes(plan)}
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
									style={{ maxHeight: 280, maxWidth: '100%', borderRadius: 8 }}
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
			{tab === 3 &&
				(courseId ? (
					<CurriculumBuilder courseId={courseId} />
				) : (
					<Box sx={{ textAlign: 'center', py: 6 }}>
						<Typography sx={{ color: 'text.secondary', mb: 2 }}>
							Save the course first (Basic Info tab) to start building the
							curriculum.
						</Typography>
						<Button variant='contained' onClick={() => void handleSave()}>
							Save Course First
						</Button>
					</Box>
				))}
		</Box>
	);
}
