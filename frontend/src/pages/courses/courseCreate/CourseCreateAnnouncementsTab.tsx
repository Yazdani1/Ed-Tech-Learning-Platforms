import { type FC } from 'react';
import {
	Avatar,
	Box,
	Button,
	TextField,
	Typography,
	Divider,
	CircularProgress,
	Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RichTextEditor from '../../../components/course/RichTextEditor';
import ItemActionMenu from '../../../components/common/ItemActionMenu';
import YouBadge from '../../../components/common/YouBadge';
import { formatDateTime } from '../../../utils/dateTime';
import type { IAnnouncement } from '../../../types/index';

interface CourseCreateAnnouncementsTabProps {
	announcements: IAnnouncement[];
	annForm: { title: string; description: string };
	annPosting: boolean;
	showAnnForm: boolean;
	editingAnnId: string | null;
	editingAnnForm: { title: string; description: string };
	annUpdating: boolean;
	currentUserId: string | undefined;
	onSetAnnForm: React.Dispatch<
		React.SetStateAction<{ title: string; description: string }>
	>;
	onSetShowAnnForm: React.Dispatch<React.SetStateAction<boolean>>;
	onPostAnnouncement: () => void;
	onDeleteAnnouncement: (id: string) => void;
	onStartEditAnnouncement: (ann: IAnnouncement) => void;
	onSetEditingAnnId: React.Dispatch<React.SetStateAction<string | null>>;
	onSetEditingAnnForm: React.Dispatch<
		React.SetStateAction<{ title: string; description: string }>
	>;
	onUpdateAnnouncement: () => void;
}

const CourseCreateAnnouncementsTab: FC<CourseCreateAnnouncementsTabProps> = ({
	announcements,
	annForm,
	annPosting,
	showAnnForm,
	editingAnnId,
	editingAnnForm,
	annUpdating,
	currentUserId,
	onSetAnnForm,
	onSetShowAnnForm,
	onPostAnnouncement,
	onDeleteAnnouncement,
	onStartEditAnnouncement,
	onSetEditingAnnId,
	onSetEditingAnnForm,
	onUpdateAnnouncement,
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
					Announcements ({announcements.length})
				</Typography>
				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={() => onSetShowAnnForm((p) => !p)}
				>
					Post Announcement
				</Button>
			</Box>

			{/* Post form */}
			{showAnnForm && (
				<Paper variant='outlined' sx={{ p: 2.5, mb: 4, borderRadius: 0.5 }}>
					<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
						New Announcement
					</Typography>
					<TextField
						label='Title'
						value={annForm.title}
						onChange={(e) =>
							onSetAnnForm((p) => ({ ...p, title: e.target.value }))
						}
						fullWidth
						size='small'
						sx={{ mb: 1.5 }}
					/>
					<RichTextEditor
						value={annForm.description}
						onChange={(html) =>
							onSetAnnForm((p) => ({ ...p, description: html }))
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
								onSetShowAnnForm(false);
								onSetAnnForm({ title: '', description: '' });
							}}
						>
							Cancel
						</Button>
						<Button
							size='small'
							variant='contained'
							startIcon={<AddIcon />}
							onClick={onPostAnnouncement}
							disabled={annPosting}
						>
							{annPosting ? <CircularProgress size={16} /> : 'Post'}
						</Button>
					</Box>
				</Paper>
			)}

			<Divider sx={{ mb: 3 }} />

			{/* Existing announcements */}
			{announcements.length === 0 ? (
				<Typography color='text.secondary'>No announcements yet.</Typography>
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
										<Typography variant='caption' color='text.secondary'>
											{ann.postedBy.name}{' '}
											{currentUserId === ann.postedBy._id && <YouBadge />}{' '}
											&bull; {ann.postedBy.role} &bull;{' '}
											{formatDateTime(ann.createdAt)}
										</Typography>
									</Box>
									{editingAnnId === ann._id ? (
										<Box sx={{ mb: 2 }}>
											<TextField
												label='Title'
												value={editingAnnForm.title}
												onChange={(e) =>
													onSetEditingAnnForm((p) => ({
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
													onSetEditingAnnForm((p) => ({
														...p,
														description: html,
													}))
												}
												placeholder='Update announcement description...'
												minHeight={100}
											/>
											<Box
												sx={{
													display: 'flex',
													gap: 1,
													justifyContent: 'flex-end',
													mt: 1.5,
												}}
											>
												<Button
													size='small'
													onClick={() => onSetEditingAnnId(null)}
												>
													Cancel
												</Button>
												<Button
													size='small'
													variant='contained'
													onClick={onUpdateAnnouncement}
													disabled={annUpdating}
												>
													{annUpdating ? (
														<CircularProgress size={16} />
													) : (
														'Update'
													)}
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
												onClick: () => onStartEditAnnouncement(ann),
											},
											{
												label: 'Delete',
												color: 'error',
												icon: (
													<DeleteIcon fontSize='small' sx={{ mr: 1 }} />
												),
												onClick: () => onDeleteAnnouncement(ann._id),
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

export default CourseCreateAnnouncementsTab;
