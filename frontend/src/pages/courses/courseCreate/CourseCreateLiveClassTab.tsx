import { type FC } from 'react';
import {
	Box,
	Button,
	TextField,
	Typography,
	Chip,
	CircularProgress,
	Grid,
	Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RichTextEditor from '../../../components/course/RichTextEditor';
import ItemActionMenu from '../../../components/common/ItemActionMenu';
import { formatLiveClassDate, formatLiveClassTime } from '../../../utils/dateTime';
import type {
	IStudyCurriculum,
	IStudyCurriculumLecture,
} from '../../../types/index';

export const blankLiveClassLecture = (): IStudyCurriculumLecture => ({
	title: '',
	description: '',
	day: '',
	time: '',
});

export const blankLiveClassForm = () => ({
	title: '',
	description: '',
	weekName: '',
	lectures: [blankLiveClassLecture()],
});

export type LiveClassFormType = ReturnType<typeof blankLiveClassForm>;

interface LiveClassLectureFieldsProps {
	lectures: IStudyCurriculumLecture[];
	onAdd: () => void;
	onRemove: (index: number) => void;
	onChange: (
		index: number,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => void;
}

const LiveClassLectureFields: FC<LiveClassLectureFieldsProps> = ({
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

interface LiveClassLectureListProps {
	liveClass: IStudyCurriculum;
	quickLecture: IStudyCurriculumLecture;
	isQuickAdding: boolean;
	onStartQuickAdd: () => void;
	onCancelQuickAdd: () => void;
	onQuickChange: (field: keyof IStudyCurriculumLecture, value: string) => void;
	onQuickSave: () => void;
}

const LiveClassLectureList: FC<LiveClassLectureListProps> = ({
	liveClass,
	quickLecture,
	isQuickAdding,
	onStartQuickAdd,
	onCancelQuickAdd,
	onQuickChange,
	onQuickSave,
}) => {
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
					{liveClass.lectures.length} class
					{liveClass.lectures.length !== 1 ? 'es' : ''}
				</Typography>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 0.5,
					overflow: 'hidden',
				}}
			>
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
						<Box
							sx={{
								display: 'flex',
								alignItems: 'flex-start',
								justifyContent: 'space-between',
								gap: 2,
								mb: 0.75,
							}}
						>
							<Typography
								variant='subtitle2'
								sx={{ fontWeight: 800, color: '#111827' }}
							>
								{lecture.title}
							</Typography>
							<Box
								sx={{
									display: 'flex',
									gap: 1,
									alignItems: 'center',
									flexShrink: 0,
								}}
							>
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
								<Chip
									icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
									label={formatLiveClassTime(lecture.time)}
									size='small'
									variant='outlined'
								/>
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
							<TextField
								label='Class Title'
								value={quickLecture.title}
								onChange={(e) => onQuickChange('title', e.target.value)}
								fullWidth
								size='small'
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField
								label='Class Date'
								type='date'
								value={quickLecture.day}
								onChange={(e) => onQuickChange('day', e.target.value)}
								fullWidth
								size='small'
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField
								label='Class Time'
								type='time'
								value={quickLecture.time}
								onChange={(e) => onQuickChange('time', e.target.value)}
								fullWidth
								size='small'
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField
								label='Description'
								value={quickLecture.description ?? ''}
								onChange={(e) => onQuickChange('description', e.target.value)}
								fullWidth
								size='small'
								multiline
								minRows={2}
							/>
						</Grid>
					</Grid>
					<Box
						sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}
					>
						<Button size='small' onClick={onCancelQuickAdd}>
							Cancel
						</Button>
						<Button size='small' variant='contained' onClick={onQuickSave}>
							Save Class
						</Button>
					</Box>
				</Paper>
			) : (
				<Button
					size='small'
					startIcon={<AddIcon />}
					sx={{ mt: 1.5 }}
					onClick={onStartQuickAdd}
				>
					Add Class
				</Button>
			)}
		</Box>
	);
};

interface CourseCreateLiveClassTabProps {
	courseId: string;
	liveClasses: IStudyCurriculum[];
	lcForm: LiveClassFormType;
	lcPosting: boolean;
	showLcForm: boolean;
	editingLcId: string | null;
	editingLcForm: LiveClassFormType;
	lcUpdating: boolean;
	quickLectureForms: Record<string, IStudyCurriculumLecture>;
	quickAddingLcId: string | null;
	onSetShowLcForm: React.Dispatch<React.SetStateAction<boolean>>;
	onSetLcForm: React.Dispatch<React.SetStateAction<LiveClassFormType>>;
	onPostLiveClass: () => void;
	onSetEditingLcId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditingLcForm: React.Dispatch<React.SetStateAction<LiveClassFormType>>;
	onUpdateLiveClass: () => void;
	onDeleteLiveClass: (id: string) => void;
	onStartEditLiveClass: (lc: IStudyCurriculum) => void;
	onStartQuickAdd: (lcId: string) => void;
	onCancelQuickAdd: () => void;
	onQuickChange: (
		lcId: string,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => void;
	onQuickSave: (lc: IStudyCurriculum) => void;
	onAddLiveClassLecture: (
		setter: React.Dispatch<React.SetStateAction<LiveClassFormType>>,
	) => void;
	onRemoveLiveClassLecture: (
		setter: React.Dispatch<React.SetStateAction<LiveClassFormType>>,
		index: number,
	) => void;
	onSetLiveClassLecture: (
		setter: React.Dispatch<React.SetStateAction<LiveClassFormType>>,
		index: number,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => void;
}

const CourseCreateLiveClassTab: FC<CourseCreateLiveClassTabProps> = ({
	courseId,
	liveClasses,
	lcForm,
	lcPosting,
	showLcForm,
	editingLcId,
	editingLcForm,
	lcUpdating,
	quickLectureForms,
	quickAddingLcId,
	onSetShowLcForm,
	onSetLcForm,
	onPostLiveClass,
	onSetEditingLcId,
	onSetEditingLcForm,
	onUpdateLiveClass,
	onDeleteLiveClass,
	onStartEditLiveClass,
	onStartQuickAdd,
	onCancelQuickAdd,
	onQuickChange,
	onQuickSave,
	onAddLiveClassLecture,
	onRemoveLiveClassLecture,
	onSetLiveClassLecture,
}) => {
	return (
		<Box sx={{ maxWidth: 1040 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
					gap: 2,
				}}
			>
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
					onClick={() => onSetShowLcForm((p) => !p)}
					disabled={!courseId}
				>
					Add Week
				</Button>
			</Box>

			{showLcForm && (
				<Paper
					variant='outlined'
					sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}
				>
					<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
						New Live Class
					</Typography>
					<Grid container spacing={1.5}>
						<Grid size={{ xs: 12, sm: 5 }}>
							<TextField
								label='Title'
								value={lcForm.title}
								onChange={(e) =>
									onSetLcForm((p) => ({ ...p, title: e.target.value }))
								}
								fullWidth
								size='small'
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 7 }}>
							<TextField
								label='Week Name'
								value={lcForm.weekName}
								onChange={(e) =>
									onSetLcForm((p) => ({ ...p, weekName: e.target.value }))
								}
								fullWidth
								size='small'
								placeholder='First week'
							/>
						</Grid>
					</Grid>
					<Box sx={{ mt: 1.5 }}>
						<RichTextEditor
							value={lcForm.description}
							onChange={(html) =>
								onSetLcForm((p) => ({ ...p, description: html }))
							}
							placeholder='Enter live class week description...'
							minHeight={100}
						/>
					</Box>
					<LiveClassLectureFields
						lectures={lcForm.lectures}
						onAdd={() => onAddLiveClassLecture(onSetLcForm)}
						onRemove={(index) => onRemoveLiveClassLecture(onSetLcForm, index)}
						onChange={(index, field, value) =>
							onSetLiveClassLecture(onSetLcForm, index, field, value)
						}
					/>
					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
						<Button
							size='small'
							onClick={() => {
								onSetShowLcForm(false);
								onSetLcForm(blankLiveClassForm());
							}}
						>
							Cancel
						</Button>
						<Button
							size='small'
							variant='contained'
							onClick={onPostLiveClass}
							disabled={lcPosting || !courseId}
						>
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
												<TextField
													label='Title'
													value={editingLcForm.title}
													onChange={(e) =>
														onSetEditingLcForm((p) => ({
															...p,
															title: e.target.value,
														}))
													}
													fullWidth
													size='small'
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 7 }}>
												<TextField
													label='Week Name'
													value={editingLcForm.weekName}
													onChange={(e) =>
														onSetEditingLcForm((p) => ({
															...p,
															weekName: e.target.value,
														}))
													}
													fullWidth
													size='small'
												/>
											</Grid>
										</Grid>
										<Box sx={{ mt: 1.5 }}>
											<RichTextEditor
												value={editingLcForm.description}
												onChange={(html) =>
													onSetEditingLcForm((p) => ({
														...p,
														description: html,
													}))
												}
												placeholder='Update live class week description...'
												minHeight={100}
											/>
										</Box>
										<LiveClassLectureFields
											lectures={editingLcForm.lectures}
											onAdd={() =>
												onAddLiveClassLecture(onSetEditingLcForm)
											}
											onRemove={(index) =>
												onRemoveLiveClassLecture(onSetEditingLcForm, index)
											}
											onChange={(index, field, value) =>
												onSetLiveClassLecture(
													onSetEditingLcForm,
													index,
													field,
													value,
												)
											}
										/>
										<Box
											sx={{
												display: 'flex',
												gap: 1,
												justifyContent: 'flex-end',
											}}
										>
											<Button
												size='small'
												onClick={() => onSetEditingLcId(null)}
											>
												Cancel
											</Button>
											<Button
												size='small'
												variant='contained'
												onClick={onUpdateLiveClass}
												disabled={lcUpdating}
											>
												{lcUpdating ? (
													<CircularProgress size={16} />
												) : (
													'Update'
												)}
											</Button>
										</Box>
									</Box>
								) : (
									<>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												gap: 1,
												alignItems: 'flex-start',
												mb: 2,
											}}
										>
											<Box
												sx={{
													display: 'flex',
													gap: 1.5,
													alignItems: 'center',
												}}
											>
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
													<Typography
														sx={{
															fontSize: '0.78rem',
															fontWeight: 800,
															lineHeight: 1.1,
														}}
													>
														Week
													</Typography>
													<Typography
														sx={{
															fontSize: '1.25rem',
															fontWeight: 900,
															lineHeight: 1.1,
														}}
													>
														{liveClasses.findIndex(
															(item) => item._id === liveClass._id,
														) + 1}
													</Typography>
												</Box>
												<Box>
													<Typography
														variant='subtitle1'
														sx={{ fontWeight: 800, color: '#111827' }}
													>
														{liveClass.title || liveClass.weekName}
													</Typography>
													<Typography
														variant='caption'
														color='text.secondary'
													>
														{liveClass.weekName}
													</Typography>
												</Box>
											</Box>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 1,
												}}
											>
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
													<Typography
														variant='caption'
														sx={{ fontWeight: 800 }}
													>
														{liveClass.lectures.length} Live Class
													</Typography>
												</Box>
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
															onClick: () => onStartEditLiveClass(liveClass),
														},
														{
															label: 'Delete',
															color: 'error',
															icon: (
																<DeleteIcon fontSize='small' sx={{ mr: 1 }} />
															),
															onClick: () => onDeleteLiveClass(liveClass._id),
														},
													]}
												/>
											</Box>
										</Box>
										<Box
											sx={{
												fontSize: '0.875rem',
												lineHeight: 1.6,
												mb: 2,
												'& p': { m: 0, mb: 0.5 },
												'& ul, & ol': { pl: 2.5, my: 0.5 },
											}}
											dangerouslySetInnerHTML={{
												__html: liveClass.description,
											}}
										/>
										<LiveClassLectureList
											liveClass={liveClass}
											quickLecture={
												quickLectureForms[liveClass._id] ??
												blankLiveClassLecture()
											}
											isQuickAdding={quickAddingLcId === liveClass._id}
											onStartQuickAdd={() => onStartQuickAdd(liveClass._id)}
											onCancelQuickAdd={onCancelQuickAdd}
											onQuickChange={(field, value) =>
												onQuickChange(liveClass._id, field, value)
											}
											onQuickSave={() => onQuickSave(liveClass)}
										/>
									</>
								)}
							</Paper>
						);
					})}
				</Box>
			)}
		</Box>
	);
};

export default CourseCreateLiveClassTab;
