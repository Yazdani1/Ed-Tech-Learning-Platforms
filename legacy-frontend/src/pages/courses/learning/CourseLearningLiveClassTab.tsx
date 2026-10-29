import { type FC } from 'react';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Grid,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import { formatDateTime, formatLiveClassDate, formatLiveClassTime } from '../../../utils/dateTime';
import type { IStudyCurriculum, IStudyCurriculumLecture } from '../../../types/index';
import RichTextEditor from '../../../components/course/RichTextEditor';
import ItemActionMenu from '../../../components/common/ItemActionMenu';
import YouBadge from '../../../components/common/YouBadge';

type CurriculumFormData = {
	title: string;
	description: string;
	weekName: string;
	lectures: IStudyCurriculumLecture[];
};

interface CurriculumLectureFieldsProps {
	lectures: IStudyCurriculumLecture[];
	onAdd: () => void;
	onRemove: (index: number) => void;
	onChange: (index: number, field: keyof IStudyCurriculumLecture, value: string) => void;
}

const CurriculumLectureFields: FC<CurriculumLectureFieldsProps> = ({
	lectures,
	onAdd,
	onRemove,
	onChange,
}) => {
	return (
		<Box sx={{ mt: 2 }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 1,
				}}
			>
				<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
					Classes
				</Typography>
				<Button size='small' startIcon={<AddIcon />} onClick={onAdd}>
					Add Class
				</Button>
			</Box>
			{lectures.map((lecture, index) => (
				<Paper
					key={lecture._id ?? index}
					variant='outlined'
					sx={{ p: 1.5, mb: 1.5, borderRadius: 0.5 }}
				>
					<Grid container spacing={1.25}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								label='Class Title'
								value={lecture.title}
								onChange={(e) => onChange(index, 'title', e.target.value)}
								fullWidth
								size='small'
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField
								label='Class Date'
								type='date'
								value={lecture.day}
								onChange={(e) => onChange(index, 'day', e.target.value)}
								fullWidth
								size='small'
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField
								label='Class Time'
								type='time'
								value={lecture.time}
								onChange={(e) => onChange(index, 'time', e.target.value)}
								fullWidth
								size='small'
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField
								label='Description'
								value={lecture.description ?? ''}
								onChange={(e) => onChange(index, 'description', e.target.value)}
								fullWidth
								size='small'
								multiline
								minRows={2}
							/>
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
};

interface CourseLearningLiveClassTabProps {
	studyCurricula: IStudyCurriculum[];
	canPostLiveClass: boolean;
	isTeacherOrAdmin: boolean;
	userId: string | undefined;
	userRole: string | undefined;
	showScForm: boolean;
	scForm: CurriculumFormData;
	scPosting: boolean;
	editingScId: string | null;
	editingScForm: CurriculumFormData;
	scUpdating: boolean;
	quickLectureForms: Record<string, IStudyCurriculumLecture>;
	quickAddingScId: string | null;
	onToggleForm: () => void;
	onScFormChange: (field: 'title' | 'description' | 'weekName', value: string) => void;
	onPost: () => void;
	onCancelAdd: () => void;
	onAddScLecture: () => void;
	onRemoveScLecture: (index: number) => void;
	onChangeScLecture: (index: number, field: keyof IStudyCurriculumLecture, value: string) => void;
	onStartEdit: (curriculum: IStudyCurriculum) => void;
	onEditFormChange: (field: 'title' | 'description' | 'weekName', value: string) => void;
	onUpdate: () => void;
	onCancelEdit: () => void;
	onAddEditScLecture: () => void;
	onRemoveEditScLecture: (index: number) => void;
	onChangeEditScLecture: (index: number, field: keyof IStudyCurriculumLecture, value: string) => void;
	onDelete: (id: string) => void;
	onStartQuickAdd: (curriculumId: string) => void;
	onQuickAdd: (curriculum: IStudyCurriculum) => void;
	onCancelQuickAdd: () => void;
	onQuickLectureFieldChange: (curriculumId: string, field: keyof IStudyCurriculumLecture, value: string) => void;
}

const CourseLearningLiveClassTab: FC<CourseLearningLiveClassTabProps> = ({
	studyCurricula,
	canPostLiveClass,
	isTeacherOrAdmin,
	userId,
	userRole,
	showScForm,
	scForm,
	scPosting,
	editingScId,
	editingScForm,
	scUpdating,
	quickLectureForms,
	quickAddingScId,
	onToggleForm,
	onScFormChange,
	onPost,
	onCancelAdd,
	onAddScLecture,
	onRemoveScLecture,
	onChangeScLecture,
	onStartEdit,
	onEditFormChange,
	onUpdate,
	onCancelEdit,
	onAddEditScLecture,
	onRemoveEditScLecture,
	onChangeEditScLecture,
	onDelete,
	onStartQuickAdd,
	onQuickAdd,
	onCancelQuickAdd,
	onQuickLectureFieldChange,
}) => {
	return (
		<Box sx={{ p: 4, maxWidth: 1120 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
				<Typography variant='h5' sx={{ fontWeight: 700 }}>
					Live Class ({studyCurricula.length})
				</Typography>
				{canPostLiveClass && (
					<Button variant='contained' startIcon={<AddIcon />} onClick={onToggleForm}>
						Add Week
					</Button>
				)}
			</Box>

			{canPostLiveClass && showScForm && (
				<Paper variant='outlined' sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}>
					<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
						New Live Class
					</Typography>
					<Grid container spacing={1.5}>
						<Grid size={{ xs: 12, sm: 5 }}>
							<TextField
								label='Title'
								value={scForm.title}
								onChange={(e) => onScFormChange('title', e.target.value)}
								fullWidth
								size='small'
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 7 }}>
							<TextField
								label='Week Name'
								value={scForm.weekName}
								onChange={(e) => onScFormChange('weekName', e.target.value)}
								fullWidth
								size='small'
								placeholder='First week'
							/>
						</Grid>
					</Grid>
					<Box sx={{ mt: 1.5 }}>
						<RichTextEditor
							value={scForm.description}
							onChange={(html) => onScFormChange('description', html)}
							placeholder='Enter live class week description...'
							minHeight={100}
						/>
					</Box>
					<CurriculumLectureFields
						lectures={scForm.lectures}
						onAdd={onAddScLecture}
						onRemove={onRemoveScLecture}
						onChange={onChangeScLecture}
					/>
					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
						<Button size='small' onClick={onCancelAdd}>
							Cancel
						</Button>
						<Button size='small' variant='contained' onClick={onPost} disabled={scPosting}>
							{scPosting ? <CircularProgress size={16} /> : 'Add'}
						</Button>
					</Box>
				</Paper>
			)}

			{studyCurricula.length === 0 ? (
				<Typography color='text.secondary'>No live class available.</Typography>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: isTeacherOrAdmin
							? '1fr'
							: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
						gap: 2.5,
						alignItems: 'start',
					}}
				>
					{studyCurricula.map((curriculum, ci) => {
						const canManage =
							userId === curriculum.postedBy._id ||
							userRole === 'Admin' ||
							userRole === 'Super Admin' ||
							userRole === 'Moderator';
						const isEditing = editingScId === curriculum._id;
						return (
							<Paper
								key={curriculum._id}
								variant='outlined'
								sx={{
									p: 2.5,
									borderRadius: 1,
									boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
								}}
							>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
											<Avatar src={curriculum.postedBy.avatar} sx={{ width: 22, height: 22, fontSize: 12, bgcolor: 'primary.main' }}>
												{curriculum.postedBy.name[0]}
											</Avatar>
											<Typography variant='caption' color='text.secondary'>
												{curriculum.postedBy.name} {userId === curriculum.postedBy._id && <YouBadge />} &bull; {curriculum.postedBy.role} &bull; {formatDateTime(curriculum.createdAt)}
											</Typography>
										</Box>
										{isEditing ? (
											<Box>
												<Grid container spacing={1.5}>
													<Grid size={{ xs: 12, sm: 5 }}>
														<TextField
															label='Title'
															value={editingScForm.title}
															onChange={(e) => onEditFormChange('title', e.target.value)}
															fullWidth
															size='small'
														/>
													</Grid>
													<Grid size={{ xs: 12, sm: 7 }}>
														<TextField
															label='Week Name'
															value={editingScForm.weekName}
															onChange={(e) => onEditFormChange('weekName', e.target.value)}
															fullWidth
															size='small'
														/>
													</Grid>
												</Grid>
												<Box sx={{ mt: 1.5 }}>
													<RichTextEditor
														value={editingScForm.description}
														onChange={(html) => onEditFormChange('description', html)}
														placeholder='Update live class week description...'
														minHeight={100}
													/>
												</Box>
												<CurriculumLectureFields
													lectures={editingScForm.lectures}
													onAdd={onAddEditScLecture}
													onRemove={onRemoveEditScLecture}
													onChange={onChangeEditScLecture}
												/>
												<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
													<Button size='small' onClick={onCancelEdit}>
														Cancel
													</Button>
													<Button size='small' variant='contained' onClick={onUpdate} disabled={scUpdating}>
														{scUpdating ? <CircularProgress size={16} /> : 'Update'}
													</Button>
												</Box>
											</Box>
										) : (
											<>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
													<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
														<Box
															sx={{
																width: 64,
																minHeight: 78,
																borderRadius: 1,
																bgcolor: ci % 3 === 0 ? '#f59e0b' : ci % 3 === 1 ? '#fb7c3c' : '#0ea5e9',
																color: 'white',
																display: 'flex',
																flexDirection: 'column',
																alignItems: 'center',
																justifyContent: 'center',
																textAlign: 'center',
																fontWeight: 800,
																lineHeight: 1.15,
																flexShrink: 0,
															}}
														>
															<Typography sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1 }}>
																Week
															</Typography>
															<Typography sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>
																{ci + 1}
															</Typography>
														</Box>
														<Box sx={{ minWidth: 0 }}>
															<Typography variant='h6' sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>
																{curriculum.title || curriculum.weekName}
															</Typography>
															<Typography variant='caption' color='text.secondary'>
																{curriculum.weekName}
															</Typography>
														</Box>
													</Box>
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
														<EventNoteOutlinedIcon sx={{ fontSize: 17 }} />
														<Typography variant='caption' sx={{ fontWeight: 800 }}>
															{curriculum.lectures.length} Live Class
														</Typography>
													</Box>
												</Box>
												<Box
													sx={{ fontSize: '0.875rem', lineHeight: 1.6, mb: 2, '& p': { m: 0, mb: 0.5 }, '& ul, & ol': { pl: 2.5, my: 0.5 } }}
													dangerouslySetInnerHTML={{ __html: curriculum.description }}
												/>
												<Box sx={{ display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 0.5, overflow: 'hidden' }}>
													{curriculum.lectures.map((lecture, index) => (
														<Box key={lecture._id ?? index} sx={{ p: 1.5, borderTop: index > 0 ? '1px solid' : 'none', borderColor: 'divider', bgcolor: 'grey.50' }}>
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
												{quickAddingScId === curriculum._id && (
													<Paper variant='outlined' sx={{ p: 1.5, mt: 1.5, borderRadius: 0.5 }}>
														<Grid container spacing={1.25}>
															<Grid size={{ xs: 12, sm: 6 }}>
																<TextField
																	label='Class Title'
																	value={quickLectureForms[curriculum._id]?.title ?? ''}
																	onChange={(e) => onQuickLectureFieldChange(curriculum._id, 'title', e.target.value)}
																	fullWidth
																	size='small'
																/>
															</Grid>
															<Grid size={{ xs: 6, sm: 3 }}>
																<TextField
																	label='Class Date'
																	type='date'
																	value={quickLectureForms[curriculum._id]?.day ?? ''}
																	onChange={(e) => onQuickLectureFieldChange(curriculum._id, 'day', e.target.value)}
																	fullWidth
																	size='small'
																	slotProps={{ inputLabel: { shrink: true } }}
																/>
															</Grid>
															<Grid size={{ xs: 6, sm: 3 }}>
																<TextField
																	label='Class Time'
																	type='time'
																	value={quickLectureForms[curriculum._id]?.time ?? ''}
																	onChange={(e) => onQuickLectureFieldChange(curriculum._id, 'time', e.target.value)}
																	fullWidth
																	size='small'
																	slotProps={{ inputLabel: { shrink: true } }}
																/>
															</Grid>
															<Grid size={{ xs: 12 }}>
																<TextField
																	label='Description'
																	value={quickLectureForms[curriculum._id]?.description ?? ''}
																	onChange={(e) => onQuickLectureFieldChange(curriculum._id, 'description', e.target.value)}
																	fullWidth
																	size='small'
																	multiline
																	minRows={2}
																/>
															</Grid>
														</Grid>
														<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
															<Button size='small' onClick={onCancelQuickAdd}>
																Cancel
															</Button>
															<Button size='small' variant='contained' onClick={() => onQuickAdd(curriculum)}>
																Save Class
															</Button>
														</Box>
													</Paper>
												)}
												{canManage && quickAddingScId !== curriculum._id && (
													<Button
														size='small'
														startIcon={<AddIcon />}
														sx={{ mt: 1.5 }}
														onClick={() => onStartQuickAdd(curriculum._id)}
													>
														Add Class
													</Button>
												)}
											</>
										)}
									</Box>
									{canManage && !isEditing && (
										<Box sx={{ flexShrink: 0 }}>
											<ItemActionMenu
												actions={[
													{ label: 'Edit', icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />, onClick: () => onStartEdit(curriculum) },
													{ label: 'Delete', color: 'error', icon: <DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />, onClick: () => onDelete(curriculum._id) },
												]}
											/>
										</Box>
									)}
								</Box>
							</Paper>
						);
					})}
				</Box>
			)}
		</Box>
	);
};

export default CourseLearningLiveClassTab;
