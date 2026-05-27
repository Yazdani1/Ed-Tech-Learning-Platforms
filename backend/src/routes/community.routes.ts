import { Router } from 'express';
import {
  archiveBadge,
  archiveChannel,
  archivePost,
  createBadge,
  createChannel,
  createPost,
  createReply,
  getAdminChannels,
  getCommunityPost,
  getCommunityReplies,
  getBadges,
  getCommunityOverview,
  getPointRules,
  reactToPost,
  reactToReply,
  toggleAcceptedReply,
  togglePinnedPost,
  updatePost,
  updateBadge,
  updateChannel,
  updatePointRules,
} from '../controllers/community.controller';
import { authorize, optionalProtect, protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', optionalProtect, getCommunityOverview);

router.get('/admin/channels', protect, authorize('Super Admin', 'Admin'), getAdminChannels);
router.post('/channels', protect, authorize('Super Admin', 'Admin'), upload.single('image'), createChannel);
router.put('/channels/:id', protect, authorize('Super Admin', 'Admin'), upload.single('image'), updateChannel);
router.patch('/channels/:id/archive', protect, authorize('Super Admin', 'Admin'), archiveChannel);

router.post('/posts', protect, upload.single('image'), createPost);
router.get('/posts/:postId', optionalProtect, getCommunityPost);
router.get('/posts/:postId/replies', optionalProtect, getCommunityReplies);
router.put('/posts/:postId', protect, upload.single('image'), updatePost);
router.post('/posts/:postId/replies', protect, createReply);
router.patch('/posts/:postId/reactions', protect, reactToPost);
router.patch('/posts/:postId/archive', protect, archivePost);
router.patch('/posts/:postId/pin', protect, authorize('Super Admin', 'Admin', 'Moderator'), togglePinnedPost);
router.patch('/replies/:replyId/reactions', protect, reactToReply);
router.patch('/replies/:replyId/accepted', protect, toggleAcceptedReply);

router.get('/badges', protect, authorize('Super Admin', 'Admin'), getBadges);
router.post('/badges', protect, authorize('Super Admin', 'Admin'), createBadge);
router.put('/badges/:id', protect, authorize('Super Admin', 'Admin'), updateBadge);
router.patch('/badges/:id/archive', protect, authorize('Super Admin', 'Admin'), archiveBadge);

router.get('/point-rules', protect, authorize('Super Admin', 'Admin'), getPointRules);
router.put('/point-rules', protect, authorize('Super Admin', 'Admin'), updatePointRules);

export default router;
