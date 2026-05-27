import { type FC } from 'react';
import {
	Avatar,
	Box,
	Button,
	CircularProgress,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { formatDateTime } from '../../../utils/dateTime';
import type { IStudyMaterial } from '../../../types/index';
import RichTextEditor from '../../../components/course/RichTextEditor';
import ItemActionMenu from '../../../components/common/ItemActionMenu';
import YouBadge from '../../../components/common/YouBadge';

interface CourseLearningStudyMaterialsTabProps {
	studyMaterials: IStudyMaterial[];
	canPost: boolean;
	userId: string | undefined;
	userRole: string | undefined;
	showSmForm: boolean;
	smForm: { title: string; description: string; fileUrl: string };
	smPosting: boolean;
	editingSmId: string | null;
	editingSmForm: { title: string; description: string; fileUrl: string };
	smUpdating: boolean;
	onToggleForm: () => void;
	onSmFormChange: (field: 'title' | 'description' | 'fileUrl', value: string) => void;
	onPost: () => void;
	onCancelPost: () => void;
	onStartEdit: (mat: IStudyMaterial) => void;
	onEditFormChange: (field: 'title' | 'description' | 'fileUrl', value: string) => void;
	onUpdate: () => void;
	onCancelEdit: () => void;
	onDelete: (id: string) => void;
}

const CourseLearningStudyMaterialsTab: FC<CourseLearningStudyMaterialsTabProps> = ({
	studyMaterials,
	canPost,
	userId,
	userRole,
	showSmForm,
	smForm,
	smPosting,
	editingSmId,
	editingSmForm,
	smUpdating,
	onToggleForm,
	onSmFormChange,
	onPost,
	onCancelPost,
	onStartEdit,
	onEditFormChange,
	onUpdate,
	onCancelEdit,
	onDelete,
}) => {
	return (
		<Box sx={{ p: 4, maxWidth: 800 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Typography variant='h5' sx={{ fontWeight: 700 }}>
					Study Materials ({studyMaterials.length})
				</Typography>
				{canPost && (
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={onToggleForm}
					>
						Add Material
					</Button>
				)}
			</Box>

			{canPost && showSmForm && (
				<Paper
					variant='outlined'
					sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}
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
						onChange={(e) => onSmFormChange('title', e.target.value)}
						fullWidth
						size='small'
						sx={{ mb: 1.5 }}
					/>
					<RichTextEditor
						value={smForm.description}
						onChange={(html) => onSmFormChange('description', html)}
						placeholder='Enter study material description...'
						minHeight={100}
					/>
					<TextField
						label='Resource Link (optional)'
						value={smForm.fileUrl}
						onChange={(e) => onSmFormChange('fileUrl', e.target.value)}
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
						}}
					>
						<Button size='small' onClick={onCancelPost}>
							Cancel
						</Button>
						<Button
							size='small'
							variant='contained'
							onClick={onPost}
							disabled={smPosting}
						>
							{smPosting ? <CircularProgress size={16} /> : 'Add'}
						</Button>
					</Box>
				</Paper>
			)}

			{studyMaterials.length === 0 ? (
				<Typography color='text.secondary'>
					No study materials available.
				</Typography>
			) : (
				<Box
					sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
				>
					{studyMaterials.map((mat) => {
						const canDelete =
							userId === mat.postedBy._id ||
							userRole === 'Admin' ||
							userRole === 'Super Admin' ||
							userRole === 'Moderator';
						return (
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
												{userId === mat.postedBy._id && <YouBadge />}{' '}
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
														onEditFormChange('title', e.target.value)
													}
													fullWidth
													size='small'
													sx={{ mb: 1.5 }}
												/>
												<RichTextEditor
													value={editingSmForm.description}
													onChange={(html) =>
														onEditFormChange('description', html)
													}
													placeholder='Update study material description...'
													minHeight={100}
												/>
												<TextField
													label='Resource Link (optional)'
													value={editingSmForm.fileUrl}
													onChange={(e) =>
														onEditFormChange('fileUrl', e.target.value)
													}
													fullWidth
													size='small'
													sx={{ mt: 1.5 }}
												/>
												<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
													<Button
														size='small'
														onClick={onCancelEdit}
													>
														Cancel
													</Button>
													<Button
														size='small'
														variant='contained'
														onClick={onUpdate}
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
										{canDelete && (
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
														onClick: () => onStartEdit(mat),
													},
													{
														label: 'Delete',
														color: 'error',
														icon: (
															<DeleteOutlinedIcon
																fontSize='small'
																sx={{ mr: 1 }}
															/>
														),
														onClick: () => onDelete(mat._id),
													},
												]}
											/>
										)}
									</Box>
								</Box>
							</Paper>
						);
					})}
				</Box>
			)}
		</Box>
	);
};

export default CourseLearningStudyMaterialsTab;
