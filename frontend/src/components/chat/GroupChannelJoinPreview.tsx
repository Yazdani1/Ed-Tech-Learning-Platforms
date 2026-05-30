import type { FC } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import type { IGroupChatChannel } from '../../types/index';

interface GroupChannelJoinPreviewProps {
	channel: IGroupChatChannel;
	hasPendingRequest: boolean;
	onJoin: () => void;
	onCancelRequest: () => void;
}

const getMemberCountLabel = (channel: IGroupChatChannel) =>
	`${channel.members.length} ${channel.members.length === 1 ? 'member' : 'members'}`;

const GroupChannelJoinPreview: FC<GroupChannelJoinPreviewProps> = ({ channel, hasPendingRequest, onJoin, onCancelRequest }) => (
	<Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 3, bgcolor: '#f7f8fc' }}>
		<Paper elevation={0} sx={{ maxWidth: 520, width: '100%', p: 4, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
			<Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: channel.type === 'Private' ? 'warning.main' : 'success.main' }}>
				{channel.type === 'Private' ? <LockIcon fontSize="large" /> : <PublicIcon fontSize="large" />}
			</Avatar>
			<Typography variant="h5" sx={{ fontWeight: 950, mb: 1 }}>{channel.name}</Typography>
			<Typography color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
				{channel.description?.trim() || 'Join this channel to view messages and chat with members.'}
			</Typography>
			<Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mb: 3 }}>
				<Chip label={channel.type} color={channel.type === 'Private' ? 'warning' : 'success'} />
				<Chip label={getMemberCountLabel(channel)} variant="outlined" />
			</Stack>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'center' }}>
				<Button
					variant="contained"
					size="large"
					disabled={hasPendingRequest}
					onClick={onJoin}
					sx={{ fontWeight: 900, textTransform: 'none', borderRadius: 5, px: 4 }}
				>
					{hasPendingRequest ? 'Join request sent' : channel.type === 'Private' ? 'Request to join' : 'Join this channel'}
				</Button>
				{hasPendingRequest && (
					<Button
						variant="outlined"
						color="error"
						size="large"
						onClick={onCancelRequest}
						sx={{ fontWeight: 900, textTransform: 'none', borderRadius: 5, px: 3 }}
					>
						Cancel request
					</Button>
				)}
			</Stack>
		</Paper>
	</Box>
);

export default GroupChannelJoinPreview;
