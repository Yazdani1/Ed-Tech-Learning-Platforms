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
	Grid,
	IconButton,
	Paper,
	Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PreviewIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import { teacherService } from '../../services/teacher.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { announcementService } from '../../services/announcement.service';
import { studyCurriculumService } from '../../services/studyCurriculum.service';
import { studyMaterialService } from '../../services/studyMaterial.service';
import RichTextEditor from '../../components/course/RichTextEditor';
import CurriculumBuilder from '../../components/course/CurriculumBuilder/CurriculumBuilder';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import YouBadge from '../../components/common/YouBadge';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import {
	formatDateTime,
	formatLiveClassDate,
	formatLiveClassTime,
	formatTime,
} from '../../utils/dateTime';
import { useAuth } from '../../context/useAuth';
import type {
	ICategory,
	ICourseType,
	ITeacher,
	IAnnouncement,
	IStudyCurriculum,
	IStudyCurriculumLecture,
	IStudyMaterial,
	SubscriptionPlan,
} from '../../types/index';
import QuizBankTab from '../../components/course/QuizBankTab';

const blankLiveClassLecture = (): IStudyCurriculumLecture => ({
	title: '',
	description: '',
	day: '',
	time: '',
});

const blankLiveClassForm = () => ({
	title: '',
	description: '',
	weekName: '',
	lectures: [blankLiveClassLecture()],
});

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

function LiveClassLectureFields({
	lectures,
	onAdd,
	onRemove,
	onChange,
}: {
	lectures: IStudyCurriculumLecture[];
	onAdd: () => void;
	onRemove: (index: number) => void;
	onChange: (
		index: number,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => void;
}) {
	return (
		<Box sx={{ mt: 2 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
				<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
					Classes
				</Typography>
				<Button size='small' startIcon={<AddIcon />} onClick={onAdd}>
					Add Class
				</Button>
			</Box>
			{lectures.map((lecture, index) => (
				<Paper key={lecture._id ?? index} variant='outlined' sx={{ p: 1.5, mb: 1.5, borderRadius: 0.5 }}>
					<Grid container spacing={1.25}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField label='Class Title' value={lecture.title} onChange={(e) => onChange(index, 'title', e.target.value)} fullWidth size='small' />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField label='Class Date' type='date' value={lecture.day} onChange={(e) => onChange(index, 'day', e.target.value)} fullWidth size='small' slotProps={{ inputLabel: { shrink: true } }} />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField label='Class Time' type='time' value={lecture.time} onChange={(e) => onChange(index, 'time', e.target.value)} fullWidth size='small' slotProps={{ inputLabel: { shrink: true } }} />
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField label='Description' value={lecture.description ?? ''} onChange={(e) => onChange(index, 'description', e.target.value)} fullWidth size='small' multiline minRows={2} />
						</Grid>
					</Grid>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
						<Button size='small' color='error' onClick={() => onRemove(index)}>
							Remove Class
						</Button>
					</Box>
				</Paper>
			))}
		</Box>
	);
}

function LiveClassLectureList({
	liveClass,
	quickLecture,
	isQuickAdding,
	onStartQuickAdd,
	onCancelQuickAdd,
	onQuickChange,
	onQuickSave,
}: {
	liveClass: IStudyCurriculum;
	quickLecture: IStudyCurriculumLecture;
	isQuickAdding: boolean;
	onStartQuickAdd: () => void;
	onCancelQuickAdd: () => void;
	onQuickChange: (field: keyof IStudyCurriculumLecture, value: string) => void;
	onQuickSave: () => void;
}) {
	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					mb: 1.25,
					color: 'text.primary',
				}}
			>
				<EventIcon sx={{ fontSize: 18, color: 'primary.main' }} />
				<Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
					{liveClass.lectures.length} class{liveClass.lectures.length !== 1 ? 'es' : ''}
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 0.5, overflow: 'hidden' }}>
				{liveClass.lectures.map((lecture, index) => (
					<Box
						key={lecture._id ?? index}
						sx={{
							p: 1.5,
							borderTop: index > 0 ? '1px solid' : 'none',
							borderColor: 'divider',
							bgcolor: 'grey.50',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
							<Typography variant='subtitle2' sx={{ fontWeight: 800, color: '#111827' }}>
								{lecture.title}
							</Typography>
							<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
								<Chip
									icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
									label={formatLiveClassDate(lecture.day)}
									size='small'
									sx={{
										bgcolor: '#e0f2fe',
										color: '#075985',
										fontWeight: 700,
										borderRadius: 1,
									}}
								/>
								<Chip icon={<AccessTimeIcon sx={{ fontSize: 14 }} />} label={formatLiveClassTime(lecture.time)} size='small' variant='outlined' />
							</Box>
						</Box>
						{lecture.description && (
							<Typography variant='body2' color='text.secondary'>
								{lecture.description}
							</Typography>
						)}
					</Box>
				))}
			</Box>
			{isQuickAdding ? (
				<Paper variant='outlined' sx={{ p: 1.5, mt: 1.5, borderRadius: 0.5 }}>
					<Grid container spacing={1.25}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField label='Class Title' value={quickLecture.title} onChange={(e) => onQuickChange('title', e.target.value)} fullWidth size='small' />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField label='Class Date' type='date' value={quickLecture.day} onChange={(e) => onQuickChange('day', e.target.value)} fullWidth size='small' slotProps={{ inputLabel: { shrink: true } }} />
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField label='Class Time' type='time' value={quickLecture.time} onChange={(e) => onQuickChange('time', e.target.value)} fullWidth size='small' slotProps={{ inputLabel: { shrink: true } }} />
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField label='Description' value={quickLecture.description ?? ''} onChange={(e) => onQuickChange('description', e.target.value)} fullWidth size='small' multiline minRows={2} />
						</Grid>
					</Grid>
					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
						<Button size='small' onClick={onCancelQuickAdd}>
							Cancel
						</Button>
						<Button size='small' variant='contained' onClick={onQuickSave}>
							Save Class
						</Button>
					</Box>
				</Paper>
			) : (
				<Button size='small' startIcon={<AddIcon />} sx={{ mt: 1.5 }} onClick={onStartQuickAdd}>
					Add Class
				</Button>
			)}
		</Box>
	);
}

export default function CourseCreatePage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { confirm } = useConfirmModal();
	const isEdit = Boolean(id);
	const [tab, setTab] = useState(0);
	const [courseId, setCourseId] = useState(id ?? '');
	const [saving, setSaving] = useState(false);
	const [autoSaving, setAutoSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState('');
	const [courseStatus, setCourseStatus] = useState<'Draft' | 'Published'>(
		'Draft',
	);
	const [publishedAt, setPublishedAt] = useState<string | null>(null);
	const [loadingCourse, setLoadingCourse] = useState(false);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [courseTypes, setCourseTypes] = useState<ICourseType[]>([]);
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
	const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
	const [annForm, setAnnForm] = useState({ title: '', description: '' });
	const [annPosting, setAnnPosting] = useState(false);
	const [showAnnForm, setShowAnnForm] = useState(false);
	const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
	const [editingAnnForm, setEditingAnnForm] = useState({ title: '', description: '' });
	const [annUpdating, setAnnUpdating] = useState(false);
	const [liveClasses, setLiveClasses] = useState<IStudyCurriculum[]>([]);
	const [lcForm, setLcForm] = useState(blankLiveClassForm);
	const [lcPosting, setLcPosting] = useState(false);
	const [showLcForm, setShowLcForm] = useState(false);
	const [editingLcId, setEditingLcId] = useState<string | null>(null);
	const [editingLcForm, setEditingLcForm] = useState(blankLiveClassForm);
	const [lcUpdating, setLcUpdating] = useState(false);
	const [quickLectureForms, setQuickLectureForms] = useState<
		Record<string, IStudyCurriculumLecture>
	>({});
	const [quickAddingLcId, setQuickAddingLcId] = useState<string | null>(null);
	const [studyMaterials, setStudyMaterials] = useState<IStudyMaterial[]>([]);
	const [smForm, setSmForm] = useState({
		title: '',
		description: '',
		fileUrl: '',
	});
	const [smPosting, setSmPosting] = useState(false);
	const [showSmForm, setShowSmForm] = useState(false);
	const [editingSmId, setEditingSmId] = useState<string | null>(null);
	const [editingSmForm, setEditingSmForm] = useState({ title: '', description: '', fileUrl: '' });
	const [smUpdating, setSmUpdating] = useState(false);
	const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const initialRender = useRef(true);
	const autoCreating = useRef(false);

	const [form, setForm] = useState({
		title: '',
		subtitle: '',
		category: '',
		courseType: '',
		startDate: '',
		endDate: '',
		selectedTeachers: [] as string[],
		description: '',
		coverImage: null as File | null,
		coverPreview: '',
		visibility: 'Private',
		pricing: 'Free',
		price: '',
		listPrice: '',
		discountPrice: '',
		includedInSubscription: false,
		allowedSubscriptionPlans: [] as SubscriptionPlan[],
		whatYouWillLearn: [] as string[],
		whatYouWillGet: [] as string[],
		requirements: [] as string[],
	});

	useEffect(() => {
		Promise.all([
			categoryService.getAll(),
			courseTypeService.getAll(),
			teacherService.getAll(),
			subscriptionPlanConfigService.getAll(),
		]).then(([catRes, ctRes, tchRes, planRes]) => {
			const cats = catRes.data ?? [];
			const types = ctRes.data ?? [];
			setCategories(cats);
			setCourseTypes(types);
			setTeachers(tchRes.data ?? []);
			setSubscriptionPlans((planRes.data ?? []).map((plan) => plan.plan));

			// Auto-create draft for new courses
			if (!id && !autoCreating.current) {
				autoCreating.current = true;
				const firstCat = cats[0]?._id ?? '';
				const firstType = types[0]?._id ?? '';
				const fd = new FormData();
				fd.append('title', 'Untitled Course');
				if (firstCat) fd.append('category', firstCat);
				if (firstType) fd.append('courseType', firstType);
				fd.append('visibility', 'Private');
				fd.append('pricing', 'Free');
				fd.append('includedInSubscription', 'false');
				fd.append('teachers', JSON.stringify([]));
				fd.append('allowedSubscriptionPlans', JSON.stringify([]));
				fd.append('whatYouWillLearn', JSON.stringify([]));
				fd.append('whatYouWillGet', JSON.stringify([]));
				fd.append('requirements', JSON.stringify([]));
				courseService
					.create(fd)
					.then(async (res) => {
						const newId = res.data?._id as string | undefined;
						if (!newId) return;
						setCourseId(newId);
						setForm((f) => ({
							...f,
							...(firstCat ? { category: firstCat } : {}),
							...(firstType ? { courseType: firstType } : {}),
						}));
						navigate(`/admin/courses/${newId}/edit`, { replace: true });
						// Auto-add Introduction section + Course Introduction lecture
						try {
							const secRes = await courseService.addSection(
								newId,
								'Introduction',
							);
							const sectionId = (secRes.data as { _id: string })?._id;
							if (sectionId) {
								await courseService.addLecture(newId, sectionId, {
									title: 'Course Introduction',
									isPreview: true,
								});
							}
						} catch {
							/* non-fatal */
						}
					})
					.catch(() => {});
			}
		});
	}, [id]);

	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((p) => ({ ...p, [key]: value }));

	const listPriceValue = Number(form.listPrice);
	const discountPriceValue = Number(form.discountPrice);
	const discountPercent =
		listPriceValue > 0 && discountPriceValue >= 0 && discountPriceValue < listPriceValue
			? Math.round(((listPriceValue - discountPriceValue) / listPriceValue) * 100)
			: 0;

	const buildFormData = () => {
		const fd = new FormData();
		fd.append('title', form.title);
		fd.append('subtitle', form.subtitle);
		fd.append('category', form.category);
		fd.append('courseType', form.courseType);
		fd.append('startDate', form.startDate);
		fd.append('endDate', form.endDate);
		fd.append('description', form.description);
		fd.append('visibility', form.visibility);
		fd.append('pricing', form.pricing);
		if (form.pricing === 'Paid') {
			if (form.listPrice) fd.append('listPrice', form.listPrice);
			if (form.discountPrice) fd.append('discountPrice', form.discountPrice);
			if (form.discountPrice) fd.append('price', form.discountPrice);
		}
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

		if (showToast && (!form.category || !form.courseType)) {
			toast.error('Please select a category and course type before publishing');
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
			const statusRes = await courseService.updateStatus(savedId, status);
			setCourseStatus(status);
			setPublishedAt(status === 'Published' ? (statusRes.data?.publishedAt ?? statusRes.data?.updatedAt ?? null) : null);
		}

		setLastSaved(formatTime(new Date()));
		return savedId;
	};

	const handleSave = async (status?: 'Draft' | 'Published') => {
		if (status === 'Published' && (!form.category || !form.courseType)) {
			toast.error('Please select a category and course type before publishing');
			return;
		}
		setSaving(true);
		try {
			await persistCourse(status);
		} finally {
			setSaving(false);
		}
	};

	const tabs = [
		'Basic Info',
		'Media',
		'Learning Content',
		'Curriculum',
		'Live Class',
		'Announcements',
		'Study Materials',
		'Quiz Bank',
	];

	useEffect(() => {
		if (tab === 4 && courseId) {
			studyCurriculumService
				.getByCourse(courseId)
				.then((r) => setLiveClasses(r.data ?? []))
				.catch(() => {});
		}
	}, [tab, courseId]);

	useEffect(() => {
		if (tab === 5 && courseId) {
			announcementService
				.getByCourse(courseId)
				.then((r) => setAnnouncements(r.data ?? []))
				.catch(() => {});
		}
	}, [tab, courseId]);

	useEffect(() => {
		if (tab === 6 && courseId) {
			studyMaterialService
				.getByCourse(courseId)
				.then((r) => setStudyMaterials(r.data ?? []))
				.catch(() => {});
		}
	}, [tab, courseId]);

	const handlePostAnnouncement = async () => {
		if (!annForm.title.trim() || !annForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		if (!courseId) {
			toast.error('Save the course first');
			return;
		}
		setAnnPosting(true);
		try {
			const res = await announcementService.create(courseId, annForm);
			if (res.data) setAnnouncements((p) => [res.data!, ...p]);
			setAnnForm({ title: '', description: '' });
			setShowAnnForm(false);
			toast.success('Announcement posted');
		} catch {
			// handled by interceptor
		} finally {
			setAnnPosting(false);
		}
	};

	const handleDeleteAnnouncement = async (annId: string) => {
		const confirmed = await confirm({
			title: 'Delete Announcement',
			message: 'Delete this announcement?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;
		try {
			await announcementService.delete(annId);
			setAnnouncements((p) => p.filter((a) => a._id !== annId));
			toast.success('Announcement deleted');
		} catch {
			// handled by interceptor
		}
	};

	const startEditAnnouncement = (ann: IAnnouncement) => {
		setEditingAnnId(ann._id);
		setEditingAnnForm({ title: ann.title, description: ann.description });
	};

	const handleUpdateAnnouncement = async () => {
		if (!editingAnnId) return;
		if (!editingAnnForm.title.trim() || !editingAnnForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setAnnUpdating(true);
		try {
			const res = await announcementService.update(editingAnnId, editingAnnForm);
			if (res.data) {
				setAnnouncements((p) =>
					p.map((a) => (a._id === editingAnnId ? res.data! : a)),
				);
			}
			setEditingAnnId(null);
			toast.success('Announcement updated');
		} catch {
			// handled by interceptor
		} finally {
			setAnnUpdating(false);
		}
	};

	const setLiveClassLecture = (
		setter: React.Dispatch<React.SetStateAction<ReturnType<typeof blankLiveClassForm>>>,
		index: number,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => {
		setter((prev) => ({
			...prev,
			lectures: prev.lectures.map((lecture, i) =>
				i === index ? { ...lecture, [field]: value } : lecture,
			),
		}));
	};

	const addLiveClassLecture = (
		setter: React.Dispatch<React.SetStateAction<ReturnType<typeof blankLiveClassForm>>>,
	) => {
		setter((prev) => ({
			...prev,
			lectures: [...prev.lectures, blankLiveClassLecture()],
		}));
	};

	const removeLiveClassLecture = (
		setter: React.Dispatch<React.SetStateAction<ReturnType<typeof blankLiveClassForm>>>,
		index: number,
	) => {
		setter((prev) => ({
			...prev,
			lectures:
				prev.lectures.length > 1
					? prev.lectures.filter((_lecture, i) => i !== index)
					: [blankLiveClassLecture()],
		}));
	};

	const validateLiveClassForm = (liveClassForm: ReturnType<typeof blankLiveClassForm>) => {
		if (!liveClassForm.title.trim() || !liveClassForm.description.trim() || !liveClassForm.weekName.trim()) {
			toast.error('Title, description, and week name are required');
			return false;
		}
		const invalidLecture = liveClassForm.lectures.some(
			(lecture) => !lecture.title.trim() || !lecture.day.trim() || !lecture.time.trim(),
		);
		if (invalidLecture) {
			toast.error('Each class needs a title, day, and time');
			return false;
		}
		return true;
	};

	const handlePostLiveClass = async () => {
		if (!courseId) {
			toast.error('Save the course first');
			return;
		}
		if (!validateLiveClassForm(lcForm)) return;
		setLcPosting(true);
		try {
			const res = await studyCurriculumService.create(courseId, lcForm);
			if (res.data) setLiveClasses((p) => [...p, res.data!]);
			setLcForm(blankLiveClassForm());
			setShowLcForm(false);
			toast.success('Live class added');
		} catch {
			// handled by interceptor
		} finally {
			setLcPosting(false);
		}
	};

	const startEditLiveClass = (liveClass: IStudyCurriculum) => {
		setEditingLcId(liveClass._id);
		setEditingLcForm({
			title: liveClass.title,
			description: liveClass.description,
			weekName: liveClass.weekName,
			lectures:
				liveClass.lectures.length > 0
					? liveClass.lectures.map((lecture) => ({
							_id: lecture._id,
							title: lecture.title,
							description: lecture.description ?? '',
							day: lecture.day,
							time: lecture.time,
						}))
					: [blankLiveClassLecture()],
		});
	};

	const handleUpdateLiveClass = async () => {
		if (!editingLcId || !validateLiveClassForm(editingLcForm)) return;
		setLcUpdating(true);
		try {
			const res = await studyCurriculumService.update(editingLcId, editingLcForm);
			if (res.data) {
				setLiveClasses((p) =>
					p.map((item) => (item._id === editingLcId ? res.data! : item)),
				);
			}
			setEditingLcId(null);
			toast.success('Live class updated');
		} catch {
			// handled by interceptor
		} finally {
			setLcUpdating(false);
		}
	};

	const handleDeleteLiveClass = async (liveClassId: string) => {
		const confirmed = await confirm({
			title: 'Delete Live Class',
			message: 'Delete this live class plan?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;
		try {
			await studyCurriculumService.delete(liveClassId);
			setLiveClasses((p) => p.filter((item) => item._id !== liveClassId));
			toast.success('Live class deleted');
		} catch {
			// handled by interceptor
		}
	};

	const setQuickLectureField = (
		liveClassId: string,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => {
		setQuickLectureForms((prev) => ({
			...prev,
			[liveClassId]: {
				...(prev[liveClassId] ?? blankLiveClassLecture()),
				[field]: value,
			},
		}));
	};

	const startQuickAddLecture = (liveClassId: string) => {
		setQuickAddingLcId(liveClassId);
		setQuickLectureForms((prev) => ({
			...prev,
			[liveClassId]: prev[liveClassId] ?? blankLiveClassLecture(),
		}));
	};

	const handleQuickAddLecture = async (liveClass: IStudyCurriculum) => {
		const lecture = quickLectureForms[liveClass._id] ?? blankLiveClassLecture();
		if (!lecture.title.trim() || !lecture.day.trim() || !lecture.time.trim()) {
			toast.error('Class title, day, and time are required');
			return;
		}
		setQuickAddingLcId(liveClass._id);
		try {
			const res = await studyCurriculumService.update(liveClass._id, {
				title: liveClass.title,
				description: liveClass.description,
				weekName: liveClass.weekName,
				lectures: [
					...liveClass.lectures,
					{
						title: lecture.title.trim(),
						description: lecture.description?.trim() ?? '',
						day: lecture.day.trim(),
						time: lecture.time.trim(),
					},
				],
			});
			if (res.data) {
				setLiveClasses((p) =>
					p.map((item) => (item._id === liveClass._id ? res.data! : item)),
				);
			}
			setQuickLectureForms((prev) => ({
				...prev,
				[liveClass._id]: blankLiveClassLecture(),
			}));
			setQuickAddingLcId(null);
			toast.success('Class added');
		} catch {
			// handled by interceptor
		} finally {
			setQuickAddingLcId(null);
		}
	};

	const handlePostStudyMaterial = async () => {
		if (!smForm.title.trim() || !smForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		if (!courseId) {
			toast.error('Save the course first');
			return;
		}
		setSmPosting(true);
		try {
			const res = await studyMaterialService.create(courseId, {
				title: smForm.title,
				description: smForm.description,
				fileUrl: smForm.fileUrl.trim() || undefined,
			});
			if (res.data) setStudyMaterials((p) => [res.data!, ...p]);
			setSmForm({ title: '', description: '', fileUrl: '' });
			setShowSmForm(false);
			toast.success('Study material added');
		} catch {
			// handled by interceptor
		} finally {
			setSmPosting(false);
		}
	};

	const handleDeleteStudyMaterial = async (smId: string) => {
		const confirmed = await confirm({
			title: 'Delete Study Material',
			message: 'Delete this study material?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;
		try {
			await studyMaterialService.delete(smId);
			setStudyMaterials((p) => p.filter((m) => m._id !== smId));
			toast.success('Study material deleted');
		} catch {
			// handled by interceptor
		}
	};

	const startEditStudyMaterial = (mat: IStudyMaterial) => {
		setEditingSmId(mat._id);
		setEditingSmForm({
			title: mat.title,
			description: mat.description,
			fileUrl: mat.fileUrl ?? '',
		});
	};

	const handleUpdateStudyMaterial = async () => {
		if (!editingSmId) return;
		if (!editingSmForm.title.trim() || !editingSmForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setSmUpdating(true);
		try {
			const res = await studyMaterialService.update(editingSmId, {
				title: editingSmForm.title,
				description: editingSmForm.description,
				fileUrl: editingSmForm.fileUrl.trim() || undefined,
			});
			if (res.data) {
				setStudyMaterials((p) =>
					p.map((m) => (m._id === editingSmId ? res.data! : m)),
				);
			}
			setEditingSmId(null);
			toast.success('Study material updated');
		} catch {
			// handled by interceptor
		} finally {
			setSmUpdating(false);
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
				setCourseStatus(data.status ?? 'Draft');
				setPublishedAt(data.status === 'Published' ? (data.publishedAt ?? data.updatedAt ?? null) : null);
				const toInputDate = (iso?: string) =>
					iso ? iso.slice(0, 10) : '';
				setForm({
					title: data.title || '',
					subtitle: data.subtitle || '',
					category: data.category?._id || '',
					courseType: data.courseType?._id || '',
					startDate: toInputDate(data.startDate),
					endDate: toInputDate(data.endDate),
					selectedTeachers: data.teachers?.map((t) => t._id) ?? [],
					description: data.description || '',
					coverImage: null,
					coverPreview: data.coverImage || '',
					visibility: data.visibility || 'Private',
					pricing: data.pricing || 'Free',
					price: data.price?.toString() || '',
					listPrice: (data.listPrice ?? data.price)?.toString() || '',
					discountPrice: (data.discountPrice ?? data.price)?.toString() || '',
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
			<Button
				variant='text'
				size='small'
				startIcon={<ArrowBackIosNewIcon fontSize='small' />}
				onClick={() => navigate('/admin/courses')}
				sx={{ fontWeight: 800, px: 0.5, mb: 1.5 }}
			>
				Back to Courses
			</Button>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 3,
				}}
			>
				<Box>
					<Typography variant='h4' sx={{ fontWeight: 700 }}>
						{isEdit ? form.title || 'Untitled Course' : 'Create Course'}
					</Typography>
					{courseId && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
							<Chip
								label={courseStatus === 'Published' ? 'Published' : 'Draft'}
								size='small'
								color={courseStatus === 'Published' ? 'success' : 'default'}
								sx={{ fontWeight: 800 }}
							/>
							{courseStatus === 'Published' && publishedAt && (
								<Chip
									label={`Published on ${formatDateTime(publishedAt)}`}
									size='small'
									variant='outlined'
									sx={{ fontWeight: 700 }}
								/>
							)}
						</Box>
					)}
				</Box>
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
					{courseId && (
						<Tooltip
							title={
								courseStatus === 'Published'
									? 'View public course page'
									: 'Preview course details'
							}
						>
							<Button
								variant='outlined'
								color={courseStatus === 'Published' ? 'success' : 'inherit'}
								size='small'
								startIcon={
									courseStatus === 'Published' ? (
										<OpenInNewIcon />
									) : (
										<PreviewIcon />
									)
								}
								onClick={() => window.open(`/courses/${courseId}`, '_blank')}
							>
								{courseStatus === 'Published' ? 'View Live' : 'Preview'}
							</Button>
						</Tooltip>
					)}
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
						elevation={2}
						sx={{
							position: { md: 'sticky' },
							top: 90,
							p: 2,
							borderRadius: '4px',
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

				<Paper
					elevation={2}
					sx={{ flex: 1, width: '100%', borderRadius: '4px', p: 3 }}
				>
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
								label='Course Type *'
								select
								value={form.courseType}
								onChange={(e) => set('courseType', e.target.value)}
								fullWidth
								helperText={
									courseTypes.length === 0
										? 'No course types available. Create one in Course Types first.'
										: undefined
								}
							>
								{courseTypes.map((ct) => (
									<MenuItem key={ct._id} value={ct._id}>
										{ct.name}
									</MenuItem>
								))}
							</TextField>

							<Box sx={{ display: 'flex', gap: 2 }}>
								<TextField
									label='Start Date'
									type='date'
									value={form.startDate}
									onChange={(e) => set('startDate', e.target.value)}
									sx={{ flex: 1 }}
									slotProps={{ inputLabel: { shrink: true } }}
									helperText='Optional'
								/>
								<TextField
									label='End Date'
									type='date'
									value={form.endDate}
									onChange={(e) => set('endDate', e.target.value)}
									sx={{ flex: 1 }}
									slotProps={{
										inputLabel: { shrink: true },
										htmlInput: { min: form.startDate || undefined }
									}}
									helperText='Optional'
								/>
							</Box>

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
									<>
										<TextField
											label='List Price (BDT)'
											type='number'
											value={form.listPrice}
											onChange={(e) => {
												set('listPrice', e.target.value);
												if (!form.discountPrice) set('discountPrice', e.target.value);
											}}
											sx={{ flex: 1 }}
										/>
										<TextField
											label='Discount Price (BDT)'
											type='number'
											value={form.discountPrice}
											onChange={(e) => {
												set('discountPrice', e.target.value);
												set('price', e.target.value);
											}}
											helperText={
												discountPercent > 0
													? `${discountPercent}% discount`
													: 'Final buying price'
											}
											sx={{ flex: 1 }}
										/>
										{discountPercent > 0 && (
											<Chip
												label={`${discountPercent}% off`}
												color='success'
												sx={{ alignSelf: 'flex-start', mt: 1, fontWeight: 900, fontSize: '0.82rem' }}
											/>
										)}
									</>
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
											{subscriptionPlans.map((plan) => (
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
					{tab === 3 &&
						(courseId ? (
							<CurriculumBuilder courseId={courseId} />
						) : (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
								<CircularProgress />
							</Box>
						))}


					{tab === 4 && (
						<Box sx={{ maxWidth: 1040 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
								<Box>
									<Typography variant='h6' sx={{ fontWeight: 700 }}>
										Live Class ({liveClasses.length})
									</Typography>
									<Typography variant='body2' color='text.secondary'>
										Add weekly live class plans and class times for this course.
									</Typography>
								</Box>
								<Button
									variant='contained'
									startIcon={<AddIcon />}
									onClick={() => setShowLcForm((p) => !p)}
									disabled={!courseId}
								>
									Add Week
								</Button>
							</Box>

							{showLcForm && (
								<Paper variant='outlined' sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}>
									<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
										New Live Class
									</Typography>
									<Grid container spacing={1.5}>
										<Grid size={{ xs: 12, sm: 5 }}>
											<TextField label='Title' value={lcForm.title} onChange={(e) => setLcForm((p) => ({ ...p, title: e.target.value }))} fullWidth size='small' />
										</Grid>
										<Grid size={{ xs: 12, sm: 7 }}>
											<TextField label='Week Name' value={lcForm.weekName} onChange={(e) => setLcForm((p) => ({ ...p, weekName: e.target.value }))} fullWidth size='small' placeholder='First week' />
										</Grid>
									</Grid>
									<Box sx={{ mt: 1.5 }}>
										<RichTextEditor value={lcForm.description} onChange={(html) => setLcForm((p) => ({ ...p, description: html }))} placeholder='Enter live class week description...' minHeight={100} />
									</Box>
									<LiveClassLectureFields
										lectures={lcForm.lectures}
										onAdd={() => addLiveClassLecture(setLcForm)}
										onRemove={(index) => removeLiveClassLecture(setLcForm, index)}
										onChange={(index, field, value) => setLiveClassLecture(setLcForm, index, field, value)}
									/>
									<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
										<Button
											size='small'
											onClick={() => {
												setShowLcForm(false);
												setLcForm(blankLiveClassForm());
											}}
										>
											Cancel
										</Button>
										<Button size='small' variant='contained' onClick={() => void handlePostLiveClass()} disabled={lcPosting || !courseId}>
											{lcPosting ? <CircularProgress size={16} /> : 'Add'}
										</Button>
									</Box>
								</Paper>
							)}

							{liveClasses.length === 0 ? (
								<Typography color='text.secondary'>No live class available.</Typography>
							) : (
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr',
										gap: 2.5,
										alignItems: 'start',
									}}
								>
									{liveClasses.map((liveClass) => {
										const isEditing = editingLcId === liveClass._id;
										return (
											<Paper
												key={liveClass._id}
												variant='outlined'
												sx={{
													p: 2.5,
													borderRadius: 1,
													boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
												}}
											>
												{isEditing ? (
													<Box>
														<Grid container spacing={1.5}>
															<Grid size={{ xs: 12, sm: 5 }}>
																<TextField label='Title' value={editingLcForm.title} onChange={(e) => setEditingLcForm((p) => ({ ...p, title: e.target.value }))} fullWidth size='small' />
															</Grid>
															<Grid size={{ xs: 12, sm: 7 }}>
																<TextField label='Week Name' value={editingLcForm.weekName} onChange={(e) => setEditingLcForm((p) => ({ ...p, weekName: e.target.value }))} fullWidth size='small' />
															</Grid>
														</Grid>
														<Box sx={{ mt: 1.5 }}>
															<RichTextEditor value={editingLcForm.description} onChange={(html) => setEditingLcForm((p) => ({ ...p, description: html }))} placeholder='Update live class week description...' minHeight={100} />
														</Box>
														<LiveClassLectureFields
															lectures={editingLcForm.lectures}
															onAdd={() => addLiveClassLecture(setEditingLcForm)}
															onRemove={(index) => removeLiveClassLecture(setEditingLcForm, index)}
															onChange={(index, field, value) => setLiveClassLecture(setEditingLcForm, index, field, value)}
														/>
														<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
															<Button size='small' onClick={() => setEditingLcId(null)}>
																Cancel
															</Button>
															<Button size='small' variant='contained' onClick={() => void handleUpdateLiveClass()} disabled={lcUpdating}>
																{lcUpdating ? <CircularProgress size={16} /> : 'Update'}
															</Button>
														</Box>
													</Box>
												) : (
													<>
														<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', mb: 2 }}>
															<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
																<Box
																	sx={{
																		width: 64,
																		minHeight: 78,
																		borderRadius: 1,
																		bgcolor: '#f59e0b',
																		color: 'white',
																		display: 'flex',
																		flexDirection: 'column',
																		alignItems: 'center',
																		justifyContent: 'center',
																		textAlign: 'center',
																		fontSize: '0.8rem',
																		fontWeight: 800,
																		lineHeight: 1.15,
																		flexShrink: 0,
																	}}
																>
																	<Typography sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1 }}>
																		Week
																	</Typography>
																	<Typography sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>
																		{liveClasses.findIndex((item) => item._id === liveClass._id) + 1}
																	</Typography>
																</Box>
																<Box>
																	<Typography variant='subtitle1' sx={{ fontWeight: 800, color: '#111827' }}>
																		{liveClass.title || liveClass.weekName}
																	</Typography>
																	<Typography variant='caption' color='text.secondary'>
																		{liveClass.weekName}
																	</Typography>
																</Box>
															</Box>
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																<Box
																	sx={{
																		display: 'flex',
																		alignItems: 'center',
																		gap: 0.75,
																		px: 1.25,
																		py: 0.65,
																		borderRadius: 1,
																		bgcolor: 'grey.100',
																		color: '#111827',
																		flexShrink: 0,
																	}}
																>
																	<EventIcon sx={{ fontSize: 17 }} />
																	<Typography variant='caption' sx={{ fontWeight: 800 }}>
																		{liveClass.lectures.length} Live Class
																	</Typography>
																</Box>
															<ItemActionMenu
																actions={[
																	{ label: 'Edit', icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />, onClick: () => startEditLiveClass(liveClass) },
																	{ label: 'Delete', color: 'error', icon: <DeleteIcon fontSize='small' sx={{ mr: 1 }} />, onClick: () => void handleDeleteLiveClass(liveClass._id) },
																]}
															/>
															</Box>
														</Box>
														<Box sx={{ fontSize: '0.875rem', lineHeight: 1.6, mb: 2, '& p': { m: 0, mb: 0.5 }, '& ul, & ol': { pl: 2.5, my: 0.5 } }} dangerouslySetInnerHTML={{ __html: liveClass.description }} />
														<LiveClassLectureList
															liveClass={liveClass}
															quickLecture={quickLectureForms[liveClass._id] ?? blankLiveClassLecture()}
															isQuickAdding={quickAddingLcId === liveClass._id}
															onStartQuickAdd={() => startQuickAddLecture(liveClass._id)}
															onCancelQuickAdd={() => setQuickAddingLcId(null)}
															onQuickChange={(field, value) => setQuickLectureField(liveClass._id, field, value)}
															onQuickSave={() => void handleQuickAddLecture(liveClass)}
														/>
													</>
												)}
											</Paper>
										);
									})}
								</Box>
							)}
						</Box>
					)}
					{/* Tab 4 – Announcements */}
					{tab === 5 && (
						<Box sx={{ maxWidth: 720 }}>
							<Box
								sx={{
								display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									mb: 3,
								}}
							>
								<Typography variant='h6' sx={{ fontWeight: 700 }}>
									Announcements ({announcements.length})
								</Typography>
								<Button
									variant='contained'
									startIcon={<AddIcon />}
									onClick={() => setShowAnnForm((p) => !p)}
								>
									Post Announcement
								</Button>
							</Box>

							{/* Post form */}
							{showAnnForm && (
								<Paper
									variant='outlined'
									sx={{ p: 2.5, mb: 4, borderRadius: 0.5 }}
								>
									<Typography
										variant='subtitle2'
										sx={{ fontWeight: 600, mb: 1.5 }}
									>
										New Announcement
									</Typography>
									<TextField
										label='Title'
										value={annForm.title}
										onChange={(e) =>
											setAnnForm((p) => ({ ...p, title: e.target.value }))
										}
										fullWidth
										size='small'
										sx={{ mb: 1.5 }}
									/>
									<RichTextEditor
										value={annForm.description}
										onChange={(html) =>
											setAnnForm((p) => ({ ...p, description: html }))
										}
										placeholder='Enter announcement description...'
										minHeight={100}
									/>
									<Box
										sx={{
											display: 'flex',
											gap: 1,
											justifyContent: 'flex-end',
											mt: 2,
										}}
									>
										<Button
											size='small'
											onClick={() => {
												setShowAnnForm(false);
												setAnnForm({ title: '', description: '' });
											}}
										>
											Cancel
										</Button>
										<Button
											size='small'
											variant='contained'
											startIcon={<AddIcon />}
											onClick={() => void handlePostAnnouncement()}
											disabled={annPosting || !courseId}
										>
											{annPosting ? <CircularProgress size={16} /> : 'Post'}
										</Button>
									</Box>
								</Paper>
							)}

							<Divider sx={{ mb: 3 }} />

							{/* Existing announcements */}
							{announcements.length === 0 ? (
								<Typography color='text.secondary'>
									No announcements yet.
								</Typography>
							) : (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{announcements.map((ann) => (
										<Paper
											key={ann._id}
											variant='outlined'
											sx={{ p: 2.5, borderRadius: 0.5 }}
										>
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'flex-start',
												}}
											>
												<Box sx={{ flex: 1 }}>
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1,
															mb: 1,
														}}
													>
														<Avatar
															src={ann.postedBy.avatar}
															sx={{
																width: 22,
																height: 22,
																fontSize: 12,
																bgcolor: 'primary.main',
															}}
														>
															{ann.postedBy.name[0]}
														</Avatar>
														<Typography
															variant='caption'
															color='text.secondary'
														>
															{ann.postedBy.name}{' '}
															{user?._id === ann.postedBy._id && <YouBadge />}{' '}
															&bull; {ann.postedBy.role}{' '}
															&bull; {formatDateTime(ann.createdAt)}
														</Typography>
													</Box>
													{editingAnnId === ann._id ? (
														<Box sx={{ mb: 2 }}>
															<TextField
																label='Title'
																value={editingAnnForm.title}
																onChange={(e) =>
																	setEditingAnnForm((p) => ({
																		...p,
																		title: e.target.value,
																	}))
																}
																fullWidth
																size='small'
																sx={{ mb: 1.5 }}
															/>
															<RichTextEditor
																value={editingAnnForm.description}
																onChange={(html) =>
																	setEditingAnnForm((p) => ({
																		...p,
																		description: html,
																	}))
																}
																placeholder='Update announcement description...'
																minHeight={100}
															/>
															<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
																<Button size='small' onClick={() => setEditingAnnId(null)}>
																	Cancel
																</Button>
																<Button
																	size='small'
																	variant='contained'
																	onClick={() => void handleUpdateAnnouncement()}
																	disabled={annUpdating}
																>
																	{annUpdating ? <CircularProgress size={16} /> : 'Update'}
																</Button>
															</Box>
														</Box>
													) : (
														<>
															<Typography
																variant='subtitle1'
																sx={{ fontWeight: 700, mb: 0.5 }}
															>
																{ann.title}
															</Typography>
															<Box
																sx={{
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																	'& p': { m: 0, mb: 0.5 },
																	'& ul, & ol': { pl: 2.5, my: 0.5 },
																}}
																dangerouslySetInnerHTML={{ __html: ann.description }}
															/>
														</>
													)}
												</Box>
												<Box sx={{ ml: 1, flexShrink: 0 }}>
													<ItemActionMenu
														actions={[
															{
																label: 'Edit',
																icon: (
																	<EditOutlinedIcon
																		fontSize='small'
																		sx={{ mr: 1 }}
																	/>
																),
																onClick: () => startEditAnnouncement(ann),
															},
															{
																label: 'Delete',
																color: 'error',
																icon: <DeleteIcon fontSize='small' sx={{ mr: 1 }} />,
																onClick: () =>
																	void handleDeleteAnnouncement(ann._id),
															},
														]}
													/>
												</Box>
											</Box>
										</Paper>
									))}
								</Box>
							)}
						</Box>
					)}

					{/* Tab 6 - Study Materials */}
					{tab === 6 && (
						<Box sx={{ maxWidth: 720 }}>
							<Box
								sx={{
								display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									mb: 3,
								}}
							>
								<Typography variant='h6' sx={{ fontWeight: 700 }}>
									Study Materials ({studyMaterials.length})
								</Typography>
								<Button
									variant='contained'
									startIcon={<AddIcon />}
									onClick={() => setShowSmForm((p) => !p)}
								>
									Add Material
								</Button>
							</Box>

							{showSmForm && (
								<Paper
									variant='outlined'
									sx={{ p: 2.5, mb: 4, borderRadius: 0.5 }}
								>
									<Typography
										variant='subtitle2'
										sx={{ fontWeight: 600, mb: 1.5 }}
									>
										New Study Material
									</Typography>
									<TextField
										label='Title'
										value={smForm.title}
										onChange={(e) =>
											setSmForm((p) => ({ ...p, title: e.target.value }))
										}
										fullWidth
										size='small'
										sx={{ mb: 1.5 }}
									/>
									<RichTextEditor
										value={smForm.description}
										onChange={(html) =>
											setSmForm((p) => ({ ...p, description: html }))
										}
										placeholder='Enter study material description...'
										minHeight={100}
									/>
									<TextField
										label='Resource Link (optional)'
										value={smForm.fileUrl}
										onChange={(e) =>
											setSmForm((p) => ({ ...p, fileUrl: e.target.value }))
										}
										fullWidth
										size='small'
										placeholder='https://...'
										sx={{ mb: 1.5 }}
									/>
									<Box
										sx={{
											display: 'flex',
											gap: 1,
											justifyContent: 'flex-end',
											mt: 2,
										}}
									>
										<Button
											size='small'
											onClick={() => {
												setShowSmForm(false);
												setSmForm({ title: '', description: '', fileUrl: '' });
											}}
										>
											Cancel
										</Button>
										<Button
											size='small'
											variant='contained'
											startIcon={<AddIcon />}
											onClick={() => void handlePostStudyMaterial()}
											disabled={smPosting || !courseId}
										>
											{smPosting ? <CircularProgress size={16} /> : 'Add'}
										</Button>
									</Box>
								</Paper>
							)}

							<Divider sx={{ mb: 3 }} />

							{studyMaterials.length === 0 ? (
								<Typography color='text.secondary'>
									No study materials yet.
								</Typography>
							) : (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{studyMaterials.map((mat) => (
										<Paper
											key={mat._id}
											variant='outlined'
											sx={{ p: 2.5, borderRadius: 0.5 }}
										>
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'flex-start',
												}}
											>
												<Box sx={{ flex: 1 }}>
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1,
															mb: 1,
														}}
													>
														<Avatar
															src={mat.postedBy.avatar}
															sx={{
																width: 22,
																height: 22,
																fontSize: 12,
																bgcolor: 'primary.main',
															}}
														>
															{mat.postedBy.name[0]}
														</Avatar>
														<Typography
															variant='caption'
															color='text.secondary'
														>
															{mat.postedBy.name}{' '}
															{user?._id === mat.postedBy._id && <YouBadge />}{' '}
															&bull; {mat.postedBy.role}{' '}
															&bull;{' '}
															{formatDateTime(mat.createdAt)}
														</Typography>
													</Box>
													{editingSmId === mat._id ? (
														<Box sx={{ mb: 2 }}>
															<TextField
																label='Title'
																value={editingSmForm.title}
																onChange={(e) =>
																	setEditingSmForm((p) => ({
																		...p,
																		title: e.target.value,
																	}))
																}
																fullWidth
																size='small'
																sx={{ mb: 1.5 }}
															/>
															<RichTextEditor
																value={editingSmForm.description}
																onChange={(html) =>
																	setEditingSmForm((p) => ({
																		...p,
																		description: html,
																	}))
																}
																placeholder='Update study material description...'
																minHeight={100}
															/>
															<TextField
																label='Resource Link (optional)'
																value={editingSmForm.fileUrl}
																onChange={(e) =>
																	setEditingSmForm((p) => ({
																		...p,
																		fileUrl: e.target.value,
																	}))
																}
																fullWidth
																size='small'
																sx={{ mt: 1.5 }}
															/>
															<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
																<Button size='small' onClick={() => setEditingSmId(null)}>
																	Cancel
																</Button>
																<Button
																	size='small'
																	variant='contained'
																	onClick={() => void handleUpdateStudyMaterial()}
																	disabled={smUpdating}
																>
																	{smUpdating ? <CircularProgress size={16} /> : 'Update'}
																</Button>
															</Box>
														</Box>
													) : (
														<>
															<Typography
																variant='subtitle1'
																sx={{ fontWeight: 700, mb: 0.5 }}
															>
																{mat.title}
															</Typography>
															<Box
																sx={{
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																	mb: mat.fileUrl ? 1 : 0,
																	'& p': { m: 0, mb: 0.5 },
																	'& ul, & ol': { pl: 2.5, my: 0.5 },
																}}
																dangerouslySetInnerHTML={{ __html: mat.description }}
															/>
															{mat.fileUrl && (
																<Typography
																	component='a'
																	href={mat.fileUrl}
																	target='_blank'
																	rel='noopener noreferrer'
																	variant='body2'
																	sx={{
																		color: 'primary.main',
																		textDecoration: 'none',
																		'&:hover': { textDecoration: 'underline' },
																	}}
																>
																	Open Resource &rarr;
																</Typography>
															)}
														</>
													)}
												</Box>
												<Box sx={{ ml: 1, flexShrink: 0 }}>
													<ItemActionMenu
														actions={[
															{
																label: 'Edit',
																icon: (
																	<EditOutlinedIcon
																		fontSize='small'
																		sx={{ mr: 1 }}
																	/>
																),
																onClick: () => startEditStudyMaterial(mat),
															},
															{
																label: 'Delete',
																color: 'error',
																icon: <DeleteIcon fontSize='small' sx={{ mr: 1 }} />,
																onClick: () =>
																	void handleDeleteStudyMaterial(mat._id),
															},
														]}
													/>
												</Box>
											</Box>
										</Paper>
									))}
								</Box>
							)}
						</Box>
					)}

					{/* Tab 7 – Quiz Bank */}
					{tab === 7 && (
						<Box>
							{!courseId ? (
								<Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
									<Typography variant='body2'>
										Save the course first to manage quiz banks.
									</Typography>
								</Box>
							) : (
								<Box sx={{ height: 600 }}>
									<QuizBankTab
										courseId={courseId}
										canPost
										userId={user?._id ?? ''}
									/>
								</Box>
							)}
						</Box>
					)}
				</Paper>
			</Box>
		</Box>
	);
}

