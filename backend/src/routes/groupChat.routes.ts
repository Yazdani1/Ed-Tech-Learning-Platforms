import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { uploadAnyFile } from '../middleware/upload.middleware';
import {
	addMembers,
	approveJoinRequest,
	archiveChannel,
	cancelJoinRequest,
	createChannel,
	createMessage,
	discoverChannels,
	getChannels,
	getMessages,
	joinChannel,
	leaveChannel,
	markChannelRead,
	removeMember,
	searchUsers,
	toggleBlockChannel,
	updateChannel,
} from '../controllers/groupChat.controller';

const router = Router();

router.use(protect);
router.get('/channels', getChannels);
router.get('/channels/discover', discoverChannels);
router.post('/channels', createChannel);
router.patch('/channels/:channelId', updateChannel);
router.get('/users/search', searchUsers);
router.post('/channels/:channelId/join', joinChannel);
router.delete('/channels/:channelId/join', cancelJoinRequest);
router.post('/channels/:channelId/approve/:userId', approveJoinRequest);
router.post('/channels/:channelId/members', addMembers);
router.delete('/channels/:channelId/members/:userId', removeMember);
router.post('/channels/:channelId/leave', leaveChannel);
router.patch('/channels/:channelId/archive', archiveChannel);
router.patch('/channels/:channelId/block', authorize('Super Admin', 'Admin', 'Moderator'), toggleBlockChannel);
router.get('/channels/:channelId/messages', getMessages);
router.post('/channels/:channelId/messages', uploadAnyFile.array('files', 10), createMessage);
router.patch('/channels/:channelId/read', markChannelRead);

export default router;
