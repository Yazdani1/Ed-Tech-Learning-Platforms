import { Router } from 'express';
import {
  archiveBadge,
  archiveAnswerReply,
  archiveChannel,
  archivePost,
  archiveReply,
  createBadge,
  createAnswerReply,
  createChannel,
  createPost,
  createReply,
  getAdminChannels,
  getAnswerReplies,
  getCommunityPost,
  getCommunityReplies,
  getCommunitySettingsForAdmin,
  getBadges,
  getCommunityOverview,
  getPointRules,
  reactToPost,
  reactToReply,
  toggleAcceptedReply,
  togglePinnedPost,
  updateCommunitySettings,
  updatePost,
  updateBadge,
  updateChannel,
  updatePointRules,
} from '../controllers/community.controller';
import { authorize, optionalProtect, protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', optionalProtect, getCommunityOverview);
router.get('/settings', protect, authorize('Super Admin', 'Admin'), getCommunitySettingsForAdmin);
router.put('/settings', protect, authorize('Super Admin', 'Admin'), upload.single('image'), updateCommunitySettings);

router.get('/admin/channels', protect, authorize('Super Admin', 'Admin'), getAdminChannels);
router.post('/channels', protect, authorize('Super Admin', 'Admin'), upload.single('image'), createChannel);
router.put('/channels/:id', protect, authorize('Super Admin', 'Admin'), upload.single('image'), updateChannel);
router.patch('/channels/:id/archive', protect, authorize('Super Admin', 'Admin'), archiveChannel);

router.post('/posts', protect, upload.array('images', 8), createPost);
router.get('/posts/:postId', optionalProtect, getCommunityPost);
router.get('/posts/:postId/replies', optionalProtect, getCommunityReplies);
router.put('/posts/:postId', protect, upload.array('images', 8), updatePost);
router.post('/posts/:postId/replies', protect, upload.array('images', 8), createReply);
router.patch('/posts/:postId/reactions', protect, reactToPost);
router.patch('/posts/:postId/archive', protect, archivePost);
router.patch('/posts/:postId/pin', protect, authorize('Super Admin', 'Admin', 'Moderator'), togglePinnedPost);
router.patch('/replies/:replyId/reactions', protect, reactToReply);
router.patch('/replies/:replyId/accepted', protect, toggleAcceptedReply);
router.patch('/replies/:replyId/archive', protect, archiveReply);
router.get('/replies/:replyId/replies', optionalProtect, getAnswerReplies);
router.post('/replies/:replyId/replies', protect, createAnswerReply);
router.patch('/answer-replies/:childReplyId/archive', protect, archiveAnswerReply);

router.get('/badges', protect, authorize('Super Admin', 'Admin'), getBadges);
router.post('/badges', protect, authorize('Super Admin', 'Admin'), upload.single('image'), createBadge);
router.put('/badges/:id', protect, authorize('Super Admin', 'Admin'), upload.single('image'), updateBadge);
router.patch('/badges/:id/archive', protect, authorize('Super Admin', 'Admin'), archiveBadge);

router.get('/point-rules', protect, authorize('Super Admin', 'Admin'), getPointRules);
router.put('/point-rules', protect, authorize('Super Admin', 'Admin'), updatePointRules);

export default router;
