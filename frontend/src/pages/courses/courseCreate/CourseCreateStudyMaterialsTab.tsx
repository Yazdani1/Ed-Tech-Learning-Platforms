import { type FC } from 'react';
import {
	Avatar,
	Box,
	Button,
	CircularProgress,
	Divider,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import RichTextEditor from '../../../components/course/RichTextEditor';
import ItemActionMenu from '../../../components/common/ItemActionMenu';
import YouBadge from '../../../components/common/YouBadge';
import { formatDateTime } from '../../../utils/dateTime';
import type { IStudyMaterial } from '../../../types/index';

interface CourseCreateStudyMaterialsTabProps {
	studyMaterials: IStudyMaterial[];
	smForm: { title: string; description: string; fileUrl: string };
	smPosting: boolean;
	showSmForm: boolean;
	editingSmId: string | null;
	editingSmForm: { title: string; description: string; fileUrl: string };
	smUpdating: boolean;
	currentUserId: string | undefined;
	onSetSmForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; fileUrl: string }>>;
	onSetShowSmForm: React.Dispatch<React.SetStateAction<boolean>>;
	onPostStudyMaterial: () => void;
	onDeleteStudyMaterial: (id: string) => void;
	onStartEditStudyMaterial: (mat: IStudyMaterial) => void;
	onSetEditingSmId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditingSmForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; fileUrl: string }>>;
	onUpdateStudyMaterial: () => void;
}

const CourseCreateStudyMaterialsTab: FC<CourseCreateStudyMaterialsTabProps> = ({
	studyMaterials,
	smForm,
	smPosting,
	showSmForm,
	editingSmId,
	editingSmForm,
	smUpdating,
	currentUserId,
	onSetSmForm,
	onSetShowSmForm,
	onPostStudyMaterial,
	onDeleteStudyMaterial,
	onStartEditStudyMaterial,
	onSetEditingSmId,
	onSetEditingSmForm,
	onUpdateStudyMaterial,
}) => {
	return (
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
					onClick={() => onSetShowSmForm((p) => !p)}
				>
					Add Material
				</Button>
			</Box>

			{showSmForm && (
				<Paper variant='outlined' sx={{ p: 2.5, mb: 4, borderRadius: 0.5 }}>
					<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
						New Study Material
					</Typography>
					<TextField
						label='Title'
						value={smForm.title}
						onChange={(e) => onSetSmForm((p) => ({ ...p, title: e.target.value }))}
						fullWidth
						size='small'
						sx={{ mb: 1.5 }}
					/>
					<RichTextEditor
						value={smForm.description}
						onChange={(html) => onSetSmForm((p) => ({ ...p, description: html }))}
						placeholder='Enter study material description...'
						minHeight={100}
					/>
					<TextField
						label='Resource Link (optional)'
						value={smForm.fileUrl}
						onChange={(e) => onSetSmForm((p) => ({ ...p, fileUrl: e.target.value }))}
						fullWidth
						size='small'
						placeholder='https://...'
						sx={{ mb: 1.5 }}
					/>
					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
						<Button
							size='small'
							onClick={() => {
								onSetShowSmForm(false);
								onSetSmForm({ title: '', description: '', fileUrl: '' });
							}}
						>
							Cancel
						</Button>
						<Button
							size='small'
							variant='contained'
							startIcon={<AddIcon />}
							onClick={onPostStudyMaterial}
							disabled={smPosting}
						>
							{smPosting ? <CircularProgress size={16} /> : 'Add'}
						</Button>
					</Box>
				</Paper>
			)}

			<Divider sx={{ mb: 3 }} />

			{studyMaterials.length === 0 ? (
				<Typography color='text.secondary'>No study materials yet.</Typography>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{studyMaterials.map((mat) => (
						<Paper key={mat._id} variant='outlined' sx={{ p: 2.5, borderRadius: 0.5 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
								}}
							>
								<Box sx={{ flex: 1 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
										<Avatar
											src={mat.postedBy.avatar}
											sx={{ width: 22, height: 22, fontSize: 12, bgcolor: 'primary.main' }}
										>
											{mat.postedBy.name[0]}
										</Avatar>
										<Typography variant='caption' color='text.secondary'>
											{mat.postedBy.name}{' '}
											{currentUserId === mat.postedBy._id && <YouBadge />}{' '}
											&bull; {mat.postedBy.role}{' '}
											&bull; {formatDateTime(mat.createdAt)}
										</Typography>
									</Box>
									{editingSmId === mat._id ? (
										<Box sx={{ mb: 2 }}>
											<TextField
												label='Title'
												value={editingSmForm.title}
												onChange={(e) => onSetEditingSmForm((p) => ({ ...p, title: e.target.value }))}
												fullWidth
												size='small'
												sx={{ mb: 1.5 }}
											/>
											<RichTextEditor
												value={editingSmForm.description}
												onChange={(html) => onSetEditingSmForm((p) => ({ ...p, description: html }))}
												placeholder='Update study material description...'
												minHeight={100}
											/>
											<TextField
												label='Resource Link (optional)'
												value={editingSmForm.fileUrl}
												onChange={(e) => onSetEditingSmForm((p) => ({ ...p, fileUrl: e.target.value }))}
												fullWidth
												size='small'
												sx={{ mt: 1.5 }}
											/>
											<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
												<Button size='small' onClick={() => onSetEditingSmId(null)}>
													Cancel
												</Button>
												<Button
													size='small'
													variant='contained'
													onClick={onUpdateStudyMaterial}
													disabled={smUpdating}
												>
													{smUpdating ? <CircularProgress size={16} /> : 'Update'}
												</Button>
											</Box>
										</Box>
									) : (
										<>
											<Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 0.5 }}>
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
												icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
												onClick: () => onStartEditStudyMaterial(mat),
											},
											{
												label: 'Delete',
												color: 'error',
												icon: <DeleteIcon fontSize='small' sx={{ mr: 1 }} />,
												onClick: () => onDeleteStudyMaterial(mat._id),
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
	);
};

export default CourseCreateStudyMaterialsTab;
