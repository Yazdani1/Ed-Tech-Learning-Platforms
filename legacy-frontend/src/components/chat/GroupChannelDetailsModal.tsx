import { Fragment, useEffect, useState, type FC } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
	Avatar,
	Badge,
	Box,
	Button,
	Chip,
	Divider,
	IconButton,
	List,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	Tab,
	Tabs,
	Typography,
} from '@mui/material';
import AppModal from '../common/AppModal';
import type { IGroupChatChannel } from '../../types/index';

interface GroupChannelDetailsModalProps {
	open: boolean;
	channel: IGroupChatChannel | null;
	currentUserId?: string;
	canManage: boolean;
	initialTab?: number;
	onClose: () => void;
	onApprove: (userId: string) => Promise<void>;
	onRemove: (userId: string, userName: string) => void;
}

const GroupChannelDetailsModal: FC<GroupChannelDetailsModalProps> = ({
	open,
	channel,
	currentUserId,
	canManage,
	initialTab = 0,
	onClose,
	onApprove,
	onRemove,
}) => {
	const [activeTab, setActiveTab] = useState(initialTab);
	const pendingRequests = channel?.joinRequests.filter((request) => request.status === 'Pending') ?? [];

	useEffect(() => {
		if (!open) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setActiveTab(initialTab);
	}, [open, initialTab]);

	return (
		<AppModal open={open} title={channel?.name ?? 'Channel Members'} onClose={onClose} cancelText="Close" maxWidth="sm">
			<Tabs value={activeTab} onChange={(_, value: number) => setActiveTab(value)} sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
				<Tab label="Description" />
				<Tab label={`Members (${channel?.members.length ?? 0})`} />
				{canManage && <Tab label={`Requests (${pendingRequests.length})`} />}
			</Tabs>
			{activeTab === 0 && (
				<Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
					<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
						{channel?.description?.trim() || 'No description added yet.'}
					</Typography>
				</Box>
			)}
			{activeTab === 1 && (
				<List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
					{channel?.members.map((member, index) => (
						<Fragment key={member.user._id}>
							<ListItemButton>
								<ListItemAvatar>
									<Badge
										overlap="circular"
										variant="dot"
										anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
										sx={{ '& .MuiBadge-badge': { bgcolor: 'success.main', border: '2px solid white' } }}
									>
										<Avatar src={member.user.avatar}>{member.user.name[0]}</Avatar>
									</Badge>
								</ListItemAvatar>
								<ListItemText primary={member.user.name} secondary={`${member.user.role} - Online status active`} />
								<Chip label={member.role} size="small" variant="outlined" />
								{canManage && member.role !== 'Admin' && member.user._id !== currentUserId && (
									<IconButton color="error" onClick={() => onRemove(member.user._id, member.user.name)}>
										<CloseIcon />
									</IconButton>
								)}
							</ListItemButton>
							{channel && index < channel.members.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
						</Fragment>
					))}
				</List>
			)}
			{canManage && activeTab === 2 && (
				pendingRequests.length > 0 ? (
					<List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
						{pendingRequests.map((request, index) => (
							<Fragment key={request.user._id}>
								<ListItemButton>
									<ListItemAvatar>
										<Avatar src={request.user.avatar}>{request.user.name[0]}</Avatar>
									</ListItemAvatar>
									<ListItemText primary={request.user.name} secondary={request.user.role} />
									<Button size="small" variant="contained" onClick={() => void onApprove(request.user._id)}>
										Accept
									</Button>
								</ListItemButton>
								{index < pendingRequests.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
							</Fragment>
						))}
					</List>
				) : (
					<Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No pending requests.</Typography>
				)
			)}
		</AppModal>
	);
};

export default GroupChannelDetailsModal;
