import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Paper,
	Tooltip,
	Typography,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PreviewIcon from '@mui/icons-material/Visibility';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import { courseTypeService } from '../../services/courseType.service';
import { teacherService } from '../../services/teacher.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { announcementService } from '../../services/announcement.service';
import { studyCurriculumService } from '../../services/studyCurriculum.service';
import { studyMaterialService } from '../../services/studyMaterial.service';
import CurriculumBuilder from '../../components/course/CurriculumBuilder/CurriculumBuilder';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { formatDateTime, formatTime } from '../../utils/dateTime';
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
import CourseCreateBasicInfoTab from './courseCreate/CourseCreateBasicInfoTab';
import CourseCreateMediaTab from './courseCreate/CourseCreateMediaTab';
import CourseCreateLearningContentTab from './courseCreate/CourseCreateLearningContentTab';
import CourseCreateLiveClassTab, {
	blankLiveClassLecture,
	blankLiveClassForm,
} from './courseCreate/CourseCreateLiveClassTab';
import CourseCreateAnnouncementsTab from './courseCreate/CourseCreateAnnouncementsTab';
import CourseCreateStudyMaterialsTab from './courseCreate/CourseCreateStudyMaterialsTab';

const CourseCreatePage= () => {
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

	const setField = (field: string, value: unknown) =>
		set(field as keyof typeof form, value as (typeof form)[keyof typeof form]);

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
					{tab === 0 && (
						<CourseCreateBasicInfoTab
							form={form}
							categories={categories}
							courseTypes={courseTypes}
							teachers={teachers}
							subscriptionPlans={subscriptionPlans}
							onSet={setField}
						/>
					)}

					{tab === 1 && (
						<CourseCreateMediaTab
							coverPreview={form.coverPreview}
							coverImage={form.coverImage}
							onCoverChange={(file, preview) => {
								set('coverImage', file);
								set('coverPreview', preview);
							}}
						/>
					)}

					{tab === 2 && (
						<CourseCreateLearningContentTab
							description={form.description}
							whatYouWillLearn={form.whatYouWillLearn}
							whatYouWillGet={form.whatYouWillGet}
							requirements={form.requirements}
							onSet={setField}
						/>
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
						<CourseCreateLiveClassTab
							courseId={courseId}
							liveClasses={liveClasses}
							lcForm={lcForm}
							lcPosting={lcPosting}
							showLcForm={showLcForm}
							editingLcId={editingLcId}
							editingLcForm={editingLcForm}
							lcUpdating={lcUpdating}
							quickLectureForms={quickLectureForms}
							quickAddingLcId={quickAddingLcId}
							onSetShowLcForm={setShowLcForm}
							onSetLcForm={setLcForm}
							onPostLiveClass={() => void handlePostLiveClass()}
							onSetEditingLcId={setEditingLcId}
							onSetEditingLcForm={setEditingLcForm}
							onUpdateLiveClass={() => void handleUpdateLiveClass()}
							onDeleteLiveClass={(id) => void handleDeleteLiveClass(id)}
							onStartEditLiveClass={startEditLiveClass}
							onStartQuickAdd={startQuickAddLecture}
							onCancelQuickAdd={() => setQuickAddingLcId(null)}
							onQuickChange={setQuickLectureField}
							onQuickSave={(lc) => void handleQuickAddLecture(lc)}
							onAddLiveClassLecture={addLiveClassLecture}
							onRemoveLiveClassLecture={removeLiveClassLecture}
							onSetLiveClassLecture={setLiveClassLecture}
						/>
					)}

					{/* Tab 5 - Announcements */}
					{tab === 5 && (
						<CourseCreateAnnouncementsTab
							announcements={announcements}
							annForm={annForm}
							annPosting={annPosting}
							showAnnForm={showAnnForm}
							editingAnnId={editingAnnId}
							editingAnnForm={editingAnnForm}
							annUpdating={annUpdating}
							currentUserId={user?._id}
							onSetAnnForm={setAnnForm}
							onSetShowAnnForm={setShowAnnForm}
							onPostAnnouncement={() => void handlePostAnnouncement()}
							onDeleteAnnouncement={(id) => void handleDeleteAnnouncement(id)}
							onStartEditAnnouncement={startEditAnnouncement}
							onSetEditingAnnId={setEditingAnnId}
							onSetEditingAnnForm={setEditingAnnForm}
							onUpdateAnnouncement={() => void handleUpdateAnnouncement()}
						/>
					)}

					{/* Tab 6 - Study Materials */}
					{tab === 6 && (
						<CourseCreateStudyMaterialsTab
							studyMaterials={studyMaterials}
							smForm={smForm}
							smPosting={smPosting}
							showSmForm={showSmForm}
							editingSmId={editingSmId}
							editingSmForm={editingSmForm}
							smUpdating={smUpdating}
							currentUserId={user?._id}
							onSetSmForm={setSmForm}
							onSetShowSmForm={setShowSmForm}
							onPostStudyMaterial={() => void handlePostStudyMaterial()}
							onDeleteStudyMaterial={(id) => void handleDeleteStudyMaterial(id)}
							onStartEditStudyMaterial={startEditStudyMaterial}
							onSetEditingSmId={setEditingSmId}
							onSetEditingSmForm={setEditingSmForm}
							onUpdateStudyMaterial={() => void handleUpdateStudyMaterial()}
						/>
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
};

export default CourseCreatePage;

