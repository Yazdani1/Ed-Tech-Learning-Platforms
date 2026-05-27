import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { CommunityAnswerReply } from '../models/CommunityAnswerReply.model';
import { CommunityBadge } from '../models/CommunityBadge.model';
import { CommunityChannel } from '../models/CommunityChannel.model';
import { CommunityPointRule, type CommunityPointRuleKey } from '../models/CommunityPointRule.model';
import { CommunityPost, type CommunityReactionType } from '../models/CommunityPost.model';
import { CommunityReply } from '../models/CommunityReply.model';
import { CommunitySetting } from '../models/CommunitySetting.model';
import { User } from '../models/User.model';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const ADMIN_ROLES = ['Super Admin', 'Admin'];
const MODERATION_ROLES = ['Super Admin', 'Admin', 'Moderator'];
const REACTION_TYPES: CommunityReactionType[] = ['Like', 'Love', 'Wow', 'Sad', 'Angry', 'Helpful'];
const DEFAULT_RULES: Array<{ key: CommunityPointRuleKey; label: string; points: number }> = [
  { key: 'acceptedAnswer', label: 'Points for accepted answer', points: 5 },
  { key: 'createPost', label: 'Points for creating a post', points: 1 },
  { key: 'createReply', label: 'Points for replying to a post', points: 1 },
  { key: 'receiveReaction', label: 'Points for receiving reactions', points: 0 },
];

const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const isAdmin = (role?: string) => ADMIN_ROLES.includes(role ?? '');
const canModerate = (role?: string) => MODERATION_ROLES.includes(role ?? '');
const idEquals = (a: unknown, b: unknown) => String(a) === String(b);

const populatePost = [
  { path: 'channel', select: 'name slug imageUrl description' },
  { path: 'author', select: 'name avatar role communityPoints' },
  { path: 'reactions.user', select: 'name avatar role' },
];
const populateReply = [
  { path: 'author', select: 'name avatar role communityPoints' },
  { path: 'reactions.user', select: 'name avatar role' },
];
const populateAnswerReply = [
  { path: 'author', select: 'name avatar role communityPoints' },
];

const ensurePointRules = async () => {
  const existing = await CommunityPointRule.find().lean();
  const existingKeys = new Set(existing.map((rule) => rule.key));
  const missing = DEFAULT_RULES.filter((rule) => !existingKeys.has(rule.key));
  if (missing.length > 0) await CommunityPointRule.insertMany(missing);
  return CommunityPointRule.find().sort({ createdAt: 1 });
};

const awardPoints = async (userId: Types.ObjectId, key: CommunityPointRuleKey) => {
  const rule = await CommunityPointRule.findOne({ key });
  const points = rule?.points ?? DEFAULT_RULES.find((item) => item.key === key)?.points ?? 0;
  if (points > 0) await User.findByIdAndUpdate(userId, { $inc: { communityPoints: points } });
};

const getPublicBadges = () => CommunityBadge.find({ isArchived: false }).sort({ requiredPoints: 1 }).lean();
const getCommunitySettings = async () => {
  const existing = await CommunitySetting.findOne().lean();
  if (existing) return existing;
  return CommunitySetting.create({});
};

const getUploadedFiles = (req: Request) => {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  return [];
};

const uploadCommunityImages = async (files: Express.Multer.File[], folder: string) =>
  Promise.all(
    files.map(async (file) => {
      const uploaded = await uploadToCloudinary(file.buffer, folder);
      return { url: uploaded.url, publicId: uploaded.publicId };
    })
  );

const getPaginationNumber = (value: unknown, fallback: number, max?: number) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  const rounded = Math.floor(parsed);
  return max ? Math.min(rounded, max) : rounded;
};

const attachAnswerReplies = async <T extends { _id: unknown }>(replies: T[]) => {
  const replyIds = replies.map((reply) => reply._id as Types.ObjectId);
  if (replyIds.length === 0) return replies.map((reply) => ({ ...reply, childReplies: [], childReplyCount: 0 }));

  const [childReplies, childReplyCounts] = await Promise.all([
    CommunityAnswerReply.find({ reply: { $in: replyIds }, isArchived: false })
      .sort({ createdAt: 1 })
      .populate(populateAnswerReply)
      .lean(),
    CommunityAnswerReply.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { reply: { $in: replyIds }, isArchived: false } },
      { $group: { _id: '$reply', count: { $sum: 1 } } },
    ]),
  ]);
  const counts = childReplyCounts.reduce<Record<string, number>>((items, item) => {
    items[String(item._id)] = item.count;
    return items;
  }, {});

  return replies.map((reply) => ({
    ...reply,
    childReplies: childReplies.filter((childReply) => idEquals(childReply.reply, reply._id)),
    childReplyCount: counts[String(reply._id)] ?? 0,
  }));
};

export const getCommunityOverview = asyncHandler(async (req: Request, res: Response) => {
  const channelId = req.query.channel ? String(req.query.channel) : undefined;
  const includeArchived = req.query.archived === 'true';
  const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
  const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;
  const search = req.query.search ? String(req.query.search).trim() : '';
  const user = req.user;

  if (includeArchived && !isAdmin(user?.role)) throw new AppError('Only admins can view archived posts', 403);
  if (dateFrom && Number.isNaN(dateFrom.getTime())) throw new AppError('Invalid start date', 400);
  if (dateTo && Number.isNaN(dateTo.getTime())) throw new AppError('Invalid end date', 400);

  const channels = await CommunityChannel.find({ isArchived: false }).sort({ name: 1 }).lean();
  const limit = user ? Number(req.query.limit ?? 30) : Math.min(Number(req.query.limit ?? 6), 6);
  const postQuery: Record<string, unknown> = { isArchived: includeArchived };
  if (channelId) postQuery.channel = channelId;
  if (dateFrom || dateTo) {
    postQuery.createdAt = {
      ...(dateFrom ? { $gte: dateFrom } : {}),
      ...(dateTo ? { $lte: new Date(dateTo.setHours(23, 59, 59, 999)) } : {}),
    };
  }
  if (search) {
    postQuery.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const posts = await CommunityPost.find(postQuery)
    .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 })
    .limit(Number.isFinite(limit) && limit > 0 ? limit : 30)
    .populate(populatePost)
    .lean();

  const postIds = posts.map((post) => post._id);
  const replies = await CommunityReply.find({ post: { $in: postIds } })
    .where({ isArchived: false })
    .sort({ isAccepted: -1, createdAt: 1 })
    .populate(populateReply)
    .lean();
  const [badges, settings] = await Promise.all([getPublicBadges(), getCommunitySettings()]);
  const channelCounts = await CommunityPost.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { isArchived: false } },
    { $group: { _id: '$channel', count: { $sum: 1 } } },
  ]);
  const [totalPostCount, totalReplyCount, totalMemberCount, channelReplyCountRows, resultPostCount] = await Promise.all([
    CommunityPost.countDocuments({ isArchived: false }),
    CommunityReply.aggregate<{ count: number }>([
      {
        $lookup: {
          from: 'communityposts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDetails',
        },
      },
      { $unwind: '$postDetails' },
      { $match: { isArchived: false, 'postDetails.isArchived': false } },
      { $count: 'count' },
    ]),
    User.countDocuments(),
    CommunityReply.aggregate<{ _id: Types.ObjectId; count: number }>([
      {
        $lookup: {
          from: 'communityposts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDetails',
        },
      },
      { $unwind: '$postDetails' },
      { $match: { isArchived: false, 'postDetails.isArchived': false } },
      { $group: { _id: '$postDetails.channel', count: { $sum: 1 } } },
    ]),
    CommunityPost.countDocuments(postQuery),
  ]);
  const channelPostCounts = channelCounts.reduce<Record<string, number>>((counts, item) => {
    counts[String(item._id)] = item.count;
    return counts;
  }, {});
  const channelReplyCounts = channelReplyCountRows.reduce<Record<string, number>>((counts, item) => {
    counts[String(item._id)] = item.count;
    return counts;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      channels,
      channelPostCounts,
      channelReplyCounts,
      settings,
      totalPostCount,
      resultPostCount,
      totalMemberCount,
      totalReplyCount: totalReplyCount[0]?.count ?? 0,
      posts: posts.map((post) => ({
        ...post,
        replies: replies.filter((reply) => idEquals(reply.post, post._id)),
      })),
      badges,
      guestLimited: !user,
    },
  });
});

export const getCommunitySettingsForAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getCommunitySettings();
  res.status(200).json({ success: true, data: settings });
});

export const updateCommunitySettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await CommunitySetting.findOne().select('+headerImagePublicId');
  const current = settings ?? new CommunitySetting({});
  const { title, description } = req.body as { title?: string; description?: string };

  if (title !== undefined) current.title = title;
  if (description !== undefined) current.description = description;
  if (req.file) {
    if (current.headerImagePublicId) await deleteFromCloudinary(current.headerImagePublicId);
    const uploaded = await uploadToCloudinary(req.file.buffer, 'medhabee/community/settings');
    current.headerImageUrl = uploaded.url;
    current.headerImagePublicId = uploaded.publicId;
  }
  current.updatedBy = req.user._id;

  await current.save();
  const updated = await CommunitySetting.findById(current._id).lean();
  res.status(200).json({ success: true, message: 'Community settings updated', data: updated });
});

export const createChannel = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) throw new AppError('Channel name is required', 400);

  const slug = toSlug(name);
  const existing = await CommunityChannel.findOne({ slug });
  if (existing) throw new AppError('Channel already exists', 400);

  const file = req.file;
  const uploaded = file ? await uploadToCloudinary(file.buffer, 'medhabee/community/channels') : undefined;
  const channel = await CommunityChannel.create({
    name,
    slug,
    description,
    imageUrl: uploaded?.url,
    imagePublicId: uploaded?.publicId,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Channel created', data: channel });
});

export const updateChannel = asyncHandler(async (req: Request, res: Response) => {
  const channel = await CommunityChannel.findById(req.params.id).select('+imagePublicId');
  if (!channel) throw new AppError('Channel not found', 404);

  const { name, description } = req.body as { name?: string; description?: string };
  if (name) {
    channel.name = name;
    channel.slug = toSlug(name);
  }
  if (description !== undefined) channel.description = description;
  if (req.file) {
    if (channel.imagePublicId) await deleteFromCloudinary(channel.imagePublicId);
    const uploaded = await uploadToCloudinary(req.file.buffer, 'medhabee/community/channels');
    channel.imageUrl = uploaded.url;
    channel.imagePublicId = uploaded.publicId;
  }

  await channel.save();
  res.status(200).json({ success: true, message: 'Channel updated', data: channel });
});

export const archiveChannel = asyncHandler(async (req: Request, res: Response) => {
  const channel = await CommunityChannel.findById(req.params.id);
  if (!channel) throw new AppError('Channel not found', 404);
  channel.isArchived = true;
  channel.archivedBy = req.user._id;
  channel.archivedAt = new Date();
  await channel.save();
  res.status(200).json({ success: true, message: 'Channel archived', data: channel });
});

export const getAdminChannels = asyncHandler(async (_req: Request, res: Response) => {
  const channels = await CommunityChannel.find().sort({ isArchived: 1, name: 1 }).lean();
  res.status(200).json({ success: true, data: channels });
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { channel, title, description } = req.body as { channel?: string; title?: string; description?: string };
  if (!channel || !title?.trim() || !description?.trim()) throw new AppError('Channel, title, and description are required', 400);

  const activeChannel = await CommunityChannel.findOne({ _id: channel, isArchived: false });
  if (!activeChannel) throw new AppError('Channel not found', 404);

  const images = await uploadCommunityImages(getUploadedFiles(req), 'medhabee/community/posts');
  const post = await CommunityPost.create({
    channel,
    title,
    description,
    imageUrl: images[0]?.url,
    imagePublicId: images[0]?.publicId,
    images,
    author: req.user._id,
  });
  await awardPoints(req.user._id, 'createPost');

  const populated = await CommunityPost.findById(post._id).populate(populatePost).lean();
  res.status(201).json({ success: true, message: 'Discussion created', data: { ...populated, replies: [] } });
});

export const getCommunityPost = asyncHandler(async (req: Request, res: Response) => {
  const includeArchived = req.query.archived === 'true';
  if (includeArchived && !isAdmin(req.user?.role)) throw new AppError('Only admins can view archived posts', 403);
  const repliesLimit = getPaginationNumber(req.query.repliesLimit, 10, 50);

  const post = await CommunityPost.findOne({ _id: req.params.postId, isArchived: includeArchived })
    .populate(populatePost)
    .lean();
  if (!post) throw new AppError('Discussion not found', 404);

  const [replies, repliesTotal] = await Promise.all([
    CommunityReply.find({ post: post._id, isArchived: false })
      .sort({ isAccepted: -1, createdAt: 1 })
      .limit(repliesLimit)
      .populate(populateReply)
      .lean(),
    CommunityReply.countDocuments({ post: post._id, isArchived: false }),
  ]);
  const [badges, channels] = await Promise.all([
    getPublicBadges(),
    CommunityChannel.find({ isArchived: false }).sort({ name: 1 }).lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      post: { ...post, replies: await attachAnswerReplies(replies), replyCount: repliesTotal },
      badges,
      channels,
      repliesPagination: {
        total: repliesTotal,
        limit: repliesLimit,
        skip: 0,
        hasMore: replies.length < repliesTotal,
      },
    },
  });
});

export const getCommunityReplies = asyncHandler(async (req: Request, res: Response) => {
  const skip = getPaginationNumber(req.query.skip, 0);
  const limit = getPaginationNumber(req.query.limit, 10, 50);
  const post = await CommunityPost.findOne({ _id: req.params.postId, isArchived: false }).select('_id');
  if (!post) throw new AppError('Discussion not found', 404);

  const [replies, total] = await Promise.all([
    CommunityReply.find({ post: post._id, isArchived: false })
      .sort({ isAccepted: -1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate(populateReply)
      .lean(),
    CommunityReply.countDocuments({ post: post._id, isArchived: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      replies: await attachAnswerReplies(replies),
      total,
      limit,
      skip,
      hasMore: skip + replies.length < total,
    },
  });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findOne({ _id: req.params.postId, isArchived: false }).select('+imagePublicId +images.publicId');
  if (!post) throw new AppError('Discussion not found', 404);
  if (!idEquals(post.author, req.user._id) && !canModerate(req.user.role)) {
    throw new AppError('You can only edit your own discussions', 403);
  }

  const { title, description, channel } = req.body as { title?: string; description?: string; channel?: string };
  if (channel) {
    const activeChannel = await CommunityChannel.findOne({ _id: channel, isArchived: false });
    if (!activeChannel) throw new AppError('Channel not found', 404);
    post.channel = activeChannel._id;
  }
  if (title?.trim()) post.title = title;
  if (description?.trim()) post.description = description;
  const postFiles = getUploadedFiles(req);
  if (postFiles.length > 0) {
    if (post.imagePublicId) await deleteFromCloudinary(post.imagePublicId);
    await Promise.all((post.images ?? []).map((image) => (image.publicId ? deleteFromCloudinary(image.publicId) : Promise.resolve())));
    const images = await uploadCommunityImages(postFiles, 'medhabee/community/posts');
    post.imageUrl = images[0]?.url;
    post.imagePublicId = images[0]?.publicId;
    post.images = images;
  }

  await post.save();
  const populated = await CommunityPost.findById(post._id).populate(populatePost).lean();
  res.status(200).json({ success: true, message: 'Discussion updated', data: populated });
});

export const createReply = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.body as { body?: string };
  if (!body?.trim()) throw new AppError('Reply body is required', 400);

  const post = await CommunityPost.findOne({ _id: req.params.postId, isArchived: false });
  if (!post) throw new AppError('Discussion not found', 404);

  const images = await uploadCommunityImages(getUploadedFiles(req), 'medhabee/community/replies');
  const reply = await CommunityReply.create({ post: post._id, body, author: req.user._id, images });
  await awardPoints(req.user._id, 'createReply');
  const populated = await CommunityReply.findById(reply._id).populate(populateReply).lean();
  res.status(201).json({ success: true, message: 'Reply added', data: populated });
});

export const getAnswerReplies = asyncHandler(async (req: Request, res: Response) => {
  const skip = getPaginationNumber(req.query.skip, 0);
  const limit = getPaginationNumber(req.query.limit, 20, 50);
  const reply = await CommunityReply.findOne({ _id: req.params.replyId, isArchived: false }).select('_id post');
  if (!reply) throw new AppError('Answer not found', 404);
  const post = await CommunityPost.findOne({ _id: reply.post, isArchived: false }).select('_id');
  if (!post) throw new AppError('Discussion not found', 404);

  const [childReplies, total] = await Promise.all([
    CommunityAnswerReply.find({ reply: reply._id, isArchived: false })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate(populateAnswerReply)
      .lean(),
    CommunityAnswerReply.countDocuments({ reply: reply._id, isArchived: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      replies: childReplies,
      total,
      limit,
      skip,
      hasMore: skip + childReplies.length < total,
    },
  });
});

export const createAnswerReply = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.body as { body?: string };
  if (!body?.trim()) throw new AppError('Reply body is required', 400);

  const reply = await CommunityReply.findOne({ _id: req.params.replyId, isArchived: false });
  if (!reply) throw new AppError('Answer not found', 404);
  const post = await CommunityPost.findOne({ _id: reply.post, isArchived: false }).select('_id');
  if (!post) throw new AppError('Discussion not found', 404);

  const childReply = await CommunityAnswerReply.create({
    reply: reply._id,
    body,
    author: req.user._id,
  });
  const populated = await CommunityAnswerReply.findById(childReply._id).populate(populateAnswerReply).lean();
  res.status(201).json({ success: true, message: 'Reply added', data: populated });
});

export const reactToPost = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body as { type?: CommunityReactionType };
  if (!type || !REACTION_TYPES.includes(type)) throw new AppError('Invalid reaction type', 400);

  const post = await CommunityPost.findOne({ _id: req.params.postId, isArchived: false });
  if (!post) throw new AppError('Discussion not found', 404);
  const existing = post.reactions.find((reaction) => idEquals(reaction.user, req.user._id));
  if (existing) {
    if (existing.type === type) {
      post.reactions = post.reactions.filter((reaction) => !idEquals(reaction.user, req.user._id));
    } else {
      existing.type = type;
    }
  } else {
    post.reactions.push({ user: req.user._id, type, createdAt: new Date() });
    await awardPoints(post.author, 'receiveReaction');
  }
  await post.save();
  const populated = await CommunityPost.findById(post._id).populate(populatePost).lean();
  res.status(200).json({ success: true, message: 'Reaction saved', data: populated });
});

export const reactToReply = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body as { type?: CommunityReactionType };
  if (!type || !REACTION_TYPES.includes(type)) throw new AppError('Invalid reaction type', 400);

  const reply = await CommunityReply.findOne({ _id: req.params.replyId, isArchived: false });
  if (!reply) throw new AppError('Reply not found', 404);
  const post = await CommunityPost.findOne({ _id: reply.post, isArchived: false });
  if (!post) throw new AppError('Discussion not found', 404);

  const existing = reply.reactions.find((reaction) => idEquals(reaction.user, req.user._id));
  if (existing) {
    if (existing.type === type) {
      reply.reactions = reply.reactions.filter((reaction) => !idEquals(reaction.user, req.user._id));
    } else {
      existing.type = type;
    }
  } else {
    reply.reactions.push({ user: req.user._id, type, createdAt: new Date() });
    await awardPoints(reply.author, 'receiveReaction');
  }
  await reply.save();
  const populated = await CommunityReply.findById(reply._id).populate(populateReply).lean();
  res.status(200).json({ success: true, message: 'Reaction saved', data: populated });
});

export const toggleAcceptedReply = asyncHandler(async (req: Request, res: Response) => {
  const reply = await CommunityReply.findOne({ _id: req.params.replyId, isArchived: false });
  if (!reply) throw new AppError('Reply not found', 404);
  const post = await CommunityPost.findById(reply.post);
  if (!post) throw new AppError('Discussion not found', 404);
  if (!idEquals(post.author, req.user._id)) throw new AppError('Only the discussion creator can accept answers', 403);

  reply.isAccepted = !reply.isAccepted;
  reply.acceptedAt = reply.isAccepted ? new Date() : undefined;
  if (reply.isAccepted && !reply.acceptedPointsAwarded) {
    await awardPoints(reply.author, 'acceptedAnswer');
    reply.acceptedPointsAwarded = true;
  }
  await reply.save();

  const populated = await CommunityReply.findById(reply._id).populate(populateReply).lean();
  res.status(200).json({ success: true, message: 'Accepted answer updated', data: populated });
});

export const archiveReply = asyncHandler(async (req: Request, res: Response) => {
  const reply = await CommunityReply.findOne({ _id: req.params.replyId, isArchived: false });
  if (!reply) throw new AppError('Reply not found', 404);
  const post = await CommunityPost.findOne({ _id: reply.post, isArchived: false });
  if (!post) throw new AppError('Discussion not found', 404);
  if (!canModerate(req.user.role) && !idEquals(reply.author, req.user._id)) {
    throw new AppError('You can only delete your own answers', 403);
  }

  reply.isArchived = true;
  reply.archivedBy = req.user._id;
  reply.archivedAt = new Date();
  await reply.save();
  res.status(200).json({ success: true, message: 'Answer deleted', data: { _id: reply._id } });
});

export const archiveAnswerReply = asyncHandler(async (req: Request, res: Response) => {
  const childReply = await CommunityAnswerReply.findOne({ _id: req.params.childReplyId, isArchived: false });
  if (!childReply) throw new AppError('Reply not found', 404);
  const reply = await CommunityReply.findOne({ _id: childReply.reply, isArchived: false });
  if (!reply) throw new AppError('Answer not found', 404);
  const post = await CommunityPost.findOne({ _id: reply.post, isArchived: false }).select('_id');
  if (!post) throw new AppError('Discussion not found', 404);
  if (!canModerate(req.user.role) && !idEquals(childReply.author, req.user._id)) {
    throw new AppError('You can only delete your own replies', 403);
  }

  childReply.isArchived = true;
  childReply.archivedBy = req.user._id;
  childReply.archivedAt = new Date();
  await childReply.save();
  res.status(200).json({ success: true, message: 'Reply deleted', data: { _id: childReply._id } });
});

export const archivePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) throw new AppError('Discussion not found', 404);
  if (!canModerate(req.user.role) && !idEquals(post.author, req.user._id)) {
    throw new AppError('You can only archive your own discussions', 403);
  }

  post.isArchived = true;
  post.archivedBy = req.user._id;
  post.archivedAt = new Date();
  await post.save();
  res.status(200).json({ success: true, message: 'Discussion archived', data: post });
});

export const togglePinnedPost = asyncHandler(async (req: Request, res: Response) => {
  if (!canModerate(req.user.role)) throw new AppError('Only staff can pin discussions', 403);
  const post = await CommunityPost.findById(req.params.postId);
  if (!post) throw new AppError('Discussion not found', 404);

  post.isPinned = !post.isPinned;
  post.pinnedBy = post.isPinned ? req.user._id : undefined;
  post.pinnedAt = post.isPinned ? new Date() : undefined;
  await post.save();
  const populated = await CommunityPost.findById(post._id).populate(populatePost).lean();
  res.status(200).json({ success: true, message: 'Pinned status updated', data: populated });
});

export const getBadges = asyncHandler(async (_req: Request, res: Response) => {
  const badges = await CommunityBadge.find().sort({ isArchived: 1, requiredPoints: 1 }).lean();
  res.status(200).json({ success: true, data: badges });
});

export const createBadge = asyncHandler(async (req: Request, res: Response) => {
  const { name, requiredPoints } = req.body as {
    name?: string;
    requiredPoints?: string;
  };
  if (!name?.trim()) throw new AppError('Badge name is required', 400);
  const uploaded = req.file ? await uploadToCloudinary(req.file.buffer, 'medhabee/community/badges') : undefined;

  const badge = await CommunityBadge.create({
    name,
    imageUrl: uploaded?.url,
    imagePublicId: uploaded?.publicId,
    requiredPoints: Number(requiredPoints ?? 0),
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, message: 'Badge created', data: badge });
});

export const updateBadge = asyncHandler(async (req: Request, res: Response) => {
  const badge = await CommunityBadge.findById(req.params.id).select('+imagePublicId');
  if (!badge) throw new AppError('Badge not found', 404);
  const { name, requiredPoints } = req.body as {
    name?: string;
    requiredPoints?: number;
  };

  if (name !== undefined) badge.name = name;
  if (requiredPoints !== undefined) badge.requiredPoints = Number(requiredPoints);
  if (req.file) {
    if (badge.imagePublicId) await deleteFromCloudinary(badge.imagePublicId);
    const uploaded = await uploadToCloudinary(req.file.buffer, 'medhabee/community/badges');
    badge.imageUrl = uploaded.url;
    badge.imagePublicId = uploaded.publicId;
  }
  await badge.save();
  res.status(200).json({ success: true, message: 'Badge updated', data: badge });
});

export const archiveBadge = asyncHandler(async (req: Request, res: Response) => {
  const badge = await CommunityBadge.findById(req.params.id);
  if (!badge) throw new AppError('Badge not found', 404);
  badge.isArchived = true;
  badge.archivedBy = req.user._id;
  badge.archivedAt = new Date();
  await badge.save();
  res.status(200).json({ success: true, message: 'Badge archived', data: badge });
});

export const getPointRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await ensurePointRules();
  res.status(200).json({ success: true, data: rules });
});

export const updatePointRules = asyncHandler(async (req: Request, res: Response) => {
  const rules = Array.isArray(req.body.rules)
    ? (req.body.rules as Array<{ key: CommunityPointRuleKey; points: number }>)
    : [];
  if (rules.length === 0) throw new AppError('Point rules are required', 400);

  await ensurePointRules();
  await Promise.all(
    rules.map((rule) =>
      CommunityPointRule.findOneAndUpdate(
        { key: rule.key },
        { points: Number(rule.points ?? 0), updatedBy: req.user._id },
        { new: true }
      )
    )
  );
  const updated = await CommunityPointRule.find().sort({ createdAt: 1 });
  res.status(200).json({ success: true, message: 'Point settings updated', data: updated });
});
