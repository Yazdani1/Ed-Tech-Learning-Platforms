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
import type { IAnnouncement } from '../../../types/index';
import RichTextEditor from '../../../components/course/RichTextEditor';
import ItemActionMenu from '../../../components/common/ItemActionMenu';
import YouBadge from '../../../components/common/YouBadge';

interface CourseLearningAnnouncementsTabProps {
	announcements: IAnnouncement[];
	canPost: boolean;
	userId: string | undefined;
	userRole: string | undefined;
	showAnnForm: boolean;
	annForm: { title: string; description: string };
	annPosting: boolean;
	editingAnnId: string | null;
	editingAnnForm: { title: string; description: string };
	annUpdating: boolean;
	onToggleForm: () => void;
	onAnnFormChange: (field: 'title' | 'description', value: string) => void;
	onPost: () => void;
	onCancelPost: () => void;
	onStartEdit: (ann: IAnnouncement) => void;
	onEditFormChange: (field: 'title' | 'description', value: string) => void;
	onUpdate: () => void;
	onCancelEdit: () => void;
	onDelete: (id: string) => void;
}

const CourseLearningAnnouncementsTab: FC<CourseLearningAnnouncementsTabProps> = ({
	announcements,
	canPost,
	userId,
	userRole,
	showAnnForm,
	annForm,
	annPosting,
	editingAnnId,
	editingAnnForm,
	annUpdating,
	onToggleForm,
	onAnnFormChange,
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
					Announcements ({announcements.length})
				</Typography>
				{canPost && (
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={onToggleForm}
					>
						Post Announcement
					</Button>
				)}
			</Box>

			{canPost && showAnnForm && (
				<Paper
					variant='outlined'
					sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}
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
						onChange={(e) => onAnnFormChange('title', e.target.value)}
						fullWidth
						size='small'
						sx={{ mb: 1.5 }}
					/>
					<RichTextEditor
						value={annForm.description}
						onChange={(html) => onAnnFormChange('description', html)}
						placeholder='Enter announcement description...'
						minHeight={100}
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
							disabled={annPosting}
						>
							{annPosting ? <CircularProgress size={16} /> : 'Post'}
						</Button>
					</Box>
				</Paper>
			)}

			{announcements.length === 0 ? (
				<Typography color='text.secondary'>
					No announcements yet.
				</Typography>
			) : (
				<Box
					sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
				>
					{announcements.map((ann) => {
						const canDelete =
							userId === ann.postedBy._id ||
							userRole === 'Admin' ||
							userRole === 'Super Admin' ||
							userRole === 'Moderator';
						return (
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
												{userId === ann.postedBy._id && <YouBadge />}{' '}
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
														onEditFormChange('title', e.target.value)
													}
													fullWidth
													size='small'
													sx={{ mb: 1.5 }}
												/>
												<RichTextEditor
													value={editingAnnForm.description}
													onChange={(html) =>
														onEditFormChange('description', html)
													}
													placeholder='Update announcement description...'
													minHeight={100}
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
														onClick: () => onStartEdit(ann),
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
														onClick: () => onDelete(ann._id),
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

export default CourseLearningAnnouncementsTab;
