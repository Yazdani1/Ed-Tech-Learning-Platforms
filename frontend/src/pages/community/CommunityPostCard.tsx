import { Fragment, useState, type FC, type MouseEvent } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PushPinIcon from '@mui/icons-material/PushPin';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import UploadIcon from '@mui/icons-material/Upload';
import ItemActionMenu, { type ItemAction } from '../../components/common/ItemActionMenu';
import RichTextEditor from '../../components/course/RichTextEditor';
import type {
  CommunityReactionType,
  ICommunityBadge,
  ICommunityPost,
  ICommunityReply,
  IUser,
} from '../../types/index';
import { canModerateRole, getUserBadges, isRichTextEmpty } from './communityHelpers';
import ReactionBar from './ReactionBar';

interface AuthorLineProps {
  author: ICommunityPost['author'] | ICommunityReply['author'];
  badges: ICommunityBadge[];
}

interface CommunityPostCardProps {
  post: ICommunityPost;
  user: IUser | null;
  badges: ICommunityBadge[];
  onReply: (postId: string, data: FormData) => Promise<void>;
  onReactPost: (postId: string, type: CommunityReactionType) => Promise<void>;
  onReactReply: (replyId: string, type: CommunityReactionType) => Promise<void>;
  onAcceptReply: (replyId: string) => Promise<void>;
  onArchiveReply: (replyId: string) => Promise<void>;
  onArchivePost: (postId: string) => Promise<void>;
  onTogglePin: (postId: string) => Promise<void>;
  onUpdatePost: (postId: string, data: FormData) => Promise<void>;
  channels: ICommunityPost['channel'][];
  showReplies?: boolean;
  onOpen?: (postId: string) => void;
  hasMoreReplies?: boolean;
  loadingMoreReplies?: boolean;
  onLoadMoreReplies?: () => Promise<void>;
}

interface CommunityImageGalleryProps {
  images: Array<{ url: string }>;
  title: string;
  detailsMode: boolean;
}

const AuthorLine: FC<AuthorLineProps> = ({ author, badges }) => {
  const earnedBadges = getUserBadges(author, badges);

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Avatar src={author.avatar} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
        {author.name[0]?.toUpperCase()}
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 900 }}>
        {author.name}
      </Typography>
      <Chip label={author.role} size="small" variant="outlined" />
      <Typography variant="caption" color="text.secondary">
        {author.communityPoints ?? 0} pts
      </Typography>
      {earnedBadges.slice(0, 3).map((badge) => (
        <Tooltip key={badge._id} title={`${badge.name} • ${badge.requiredPoints} pts`}>
          <Chip size="small" label={`${badge.icon} ${badge.name}`} color="success" variant="outlined" />
        </Tooltip>
      ))}
    </Stack>
  );
};

const getPlainText = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};

const getExcerpt = (html: string, maxLength = 220) => {
  const text = getPlainText(html);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const getPostImages = (post: ICommunityPost) => {
  const images = post.images?.filter((image) => image.url) ?? [];
  if (images.length > 0) return images;
  return post.imageUrl ? [{ url: post.imageUrl }] : [];
};

const CommunityImageGallery: FC<CommunityImageGalleryProps> = ({ images, title, detailsMode }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  if (images.length === 0) return null;
  const activeImage = images[Math.min(activeIndex, images.length - 1)];

  if (!detailsMode) {
    return (
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {images.slice(0, 4).map((image, index) => (
          <Box
            key={`${image.url}-${index}`}
            component="img"
            src={image.url}
            alt={`${title} ${index + 1}`}
            sx={{ width: 116, height: 82, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
          />
        ))}
        {images.length > 4 && (
          <Box
            sx={{
              width: 116,
              height: 82,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.100',
              fontWeight: 900,
            }}
          >
            +{images.length - 4}
          </Box>
        )}
      </Stack>
    );
  }

  return (
    <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'grey.100' }}>
      <Box
        component="img"
        src={activeImage.url}
        alt={`${title} ${activeIndex + 1}`}
        sx={{ width: '100%', maxHeight: 520, objectFit: 'contain', display: 'block', bgcolor: 'grey.100' }}
      />
      {images.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            onClick={() => setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1))}
            sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.100' } }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Next image"
            onClick={() => setActiveIndex((index) => (index + 1) % images.length)}
            sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.100' } }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
          <Box sx={{ position: 'absolute', right: 12, bottom: 12, px: 1, py: 0.35, borderRadius: 999, bgcolor: 'rgba(15,23,42,0.72)', color: 'common.white', fontSize: 12, fontWeight: 900 }}>
            {activeIndex + 1} / {images.length}
          </Box>
        </>
      )}
    </Box>
  );
};

const CommunityPostCard: FC<CommunityPostCardProps> = ({
  post,
  user,
  badges,
  onReply,
  onReactPost,
  onReactReply,
  onAcceptReply,
  onArchiveReply,
  onArchivePost,
  onTogglePin,
  onUpdatePost,
  channels,
  showReplies = true,
  onOpen,
  hasMoreReplies = false,
  loadingMoreReplies = false,
  onLoadMoreReplies,
}) => {
  const [replyBody, setReplyBody] = useState('');
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);
  const [replyFormOpen, setReplyFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    channel: post.channel._id,
    title: post.title,
    description: post.description,
    image: null as File | null,
  });
  const isAuthor = user?._id === post.author._id;
  const canArchive = Boolean(user && (isAuthor || canModerateRole(user.role)));
  const canPin = canModerateRole(user?.role);
  const postImages = getPostImages(post);

  const submitReply = async () => {
    if (isRichTextEmpty(replyBody)) return;
    setReplying(true);
    const data = new FormData();
    data.append('body', replyBody.trim());
    replyImages.forEach((image) => data.append('images', image));
    await onReply(post._id, data);
    setReplyBody('');
    setReplyImages([]);
    setReplyFormOpen(false);
    setReplying(false);
  };

  const addReplyImages = (files: FileList | null) => {
    if (!files) return;
    setReplyImages((current) => [...current, ...Array.from(files)]);
  };

  const removeReplyImage = (index: number) => {
    setReplyImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const submitEdit = async () => {
    const data = new FormData();
    data.append('channel', editForm.channel);
    data.append('title', editForm.title);
    data.append('description', editForm.description);
    if (editForm.image) data.append('images', editForm.image);
    await onUpdatePost(post._id, data);
    setEditing(false);
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (!onOpen || editing || showReplies) return;
    const target = event.target as HTMLElement;
    const interactiveElement = target.closest(
      'a, button, input, textarea, select, [role="button"], [contenteditable="true"], .MuiMenu-root, .MuiDialog-root'
    );
    if (interactiveElement) return;
    onOpen(post._id);
  };

  const actions: ItemAction[] = [
    ...(isAuthor || canModerateRole(user?.role)
      ? [{ label: 'Edit', icon: <EditIcon />, onClick: () => setEditing(true) }]
      : []),
    ...(canPin
      ? [{ label: post.isPinned ? 'Unpin' : 'Pin', icon: <PushPinIcon />, checked: post.isPinned, onClick: () => void onTogglePin(post._id) }]
      : []),
    ...(canArchive
      ? [{ label: 'Delete', icon: <DeleteIcon />, color: 'error' as const, onClick: () => void onArchivePost(post._id) }]
      : []),
  ];

  return (
    <Paper
      elevation={0}
      onClick={handleCardClick}
      sx={{
        border: '1px solid',
        borderColor: post.isPinned ? 'warning.main' : 'divider',
        bgcolor: post.isPinned ? 'warning.50' : 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: onOpen && !showReplies ? 'pointer' : 'default',
        transition: onOpen && !showReplies ? 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease' : undefined,
        '&:hover': onOpen && !showReplies ? {
          borderColor: post.isPinned ? 'warning.dark' : 'primary.light',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
          transform: 'translateY(-1px)',
        } : undefined,
      }}
    >
      {post.isPinned && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: 'warning.light', color: 'warning.contrastText', fontWeight: 900 }}>
          Pinned discussion
        </Box>
      )}
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Box>
              <AuthorLine author={post.author} badges={badges} />
              <Typography variant="caption" color="text.secondary" component="div">
                {new Date(post.createdAt).toLocaleString()} in{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 900 }}>
                  {post.channel.name}
                </Box>
              </Typography>
            </Box>
            <ItemActionMenu actions={actions} />
          </Stack>

          {editing ? (
            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Stack spacing={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Channel</InputLabel>
                  <Select label="Channel" value={editForm.channel} onChange={(event) => setEditForm({ ...editForm, channel: event.target.value })}>
                    {channels.map((channel) => (
                      <MenuItem key={channel._id} value={channel._id}>
                        {channel.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />
                <RichTextEditor
                  key={`edit-${post._id}`}
                  value={editForm.description}
                  onChange={(description) => setEditForm({ ...editForm, description })}
                  placeholder="Update the discussion details..."
                  minHeight={160}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="outlined" component="label">
                    Change image
                    <input hidden type="file" accept="image/*" onChange={(event) => setEditForm({ ...editForm, image: event.target.files?.[0] ?? null })} />
                  </Button>
                  <Button variant="contained" disabled={!editForm.title.trim() || isRichTextEmpty(editForm.description)} onClick={() => void submitEdit()}>
                    Save changes
                  </Button>
                  <Button onClick={() => setEditing(false)}>Cancel</Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <>
              <Typography
                variant="h6"
                onClick={() => onOpen?.(post._id)}
                sx={{ fontWeight: 900, lineHeight: 1.25, cursor: onOpen ? 'pointer' : 'default' }}
              >
                {post.title}
              </Typography>
              {showReplies ? (
                <Box
                  color="text.secondary"
                  sx={{ '& p': { my: 0.75 }, '& ul, & ol': { pl: 3 } }}
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
              ) : (
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {getExcerpt(post.description)}
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 900 }}>
                    {' '}Read more
                  </Box>
                </Typography>
              )}
            </>
          )}
          <CommunityImageGallery images={postImages} title={post.title} detailsMode={showReplies} />
          <ReactionBar
            reactions={post.reactions}
            disabled={!user}
            currentUserId={user?._id}
            onReact={(type) => void onReactPost(post._id, type)}
            answerCount={post.replyCount ?? post.replies.length}
            onAnswerClick={() => onOpen?.(post._id)}
          />
        </Stack>
      </Box>

      {showReplies && (
      <>
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        {user ? (
          <Stack spacing={1.25} sx={{ alignItems: 'flex-end' }}>
            {!replyFormOpen && (
              <Button
                variant="contained"
                startIcon={<ReplyIcon />}
                onClick={() => setReplyFormOpen(true)}
              >
                Reply
              </Button>
            )}
            {replyFormOpen && (
              <Stack spacing={1} sx={{ width: '100%' }}>
                <RichTextEditor
                  value={replyBody}
                  onChange={setReplyBody}
                  placeholder="Write a reply..."
                  minHeight={140}
                />
                <Stack spacing={1}>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ alignSelf: 'flex-start' }}>
                    Upload images
                    <input hidden multiple type="file" accept="image/*" onChange={(event) => addReplyImages(event.target.files)} />
                  </Button>
                  {replyImages.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {replyImages.map((image, index) => (
                        <Chip
                          key={`${image.name}-${index}`}
                          label={image.name}
                          onDelete={() => removeReplyImage(index)}
                          deleteIcon={<CloseIcon />}
                          variant="outlined"
                          sx={{ maxWidth: 260 }}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={replying || isRichTextEmpty(replyBody)}
                    onClick={() => void submitReply()}
                  >
                    Publish Reply
                  </Button>
                  <Button onClick={() => setReplyFormOpen(false)}>Cancel</Button>
                </Stack>
              </Stack>
            )}
          </Stack>
        ) : (
          <Button href="/auth/login" variant="outlined" startIcon={<ReplyIcon />} sx={{ display: 'flex', ml: 'auto' }}>
            Sign in to reply
          </Button>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 2.5, bgcolor: 'grey.50' }}>
        <Stack spacing={2}>
          {post.replies.map((reply, index) => {
            const canArchiveReply = Boolean(user && (user._id === reply.author._id || canModerateRole(user.role)));
            const replyActions: ItemAction[] = canArchiveReply
              ? [{ label: 'Delete', icon: <DeleteIcon />, color: 'error' as const, onClick: () => void onArchiveReply(reply._id) }]
              : [];

            return (
              <Fragment key={reply._id}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: reply.isAccepted ? 'success.50' : 'transparent',
                    borderRadius: reply.isAccepted ? 1 : 0,
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                      <AuthorLine author={reply.author} badges={badges} />
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        {isAuthor && (
                          <Tooltip title={reply.isAccepted ? 'Remove accepted answer' : 'Mark accepted answer'}>
                            <Button size="small" color={reply.isAccepted ? 'success' : 'inherit'} startIcon={<CheckCircleIcon />} onClick={() => onAcceptReply(reply._id)}>
                              {reply.isAccepted ? 'Accepted' : 'Accept'}
                            </Button>
                          </Tooltip>
                        )}
                        <ItemActionMenu actions={replyActions} />
                      </Stack>
                    </Stack>
                    {reply.isAccepted && <Chip label="Accepted answer" color="success" size="small" sx={{ alignSelf: 'flex-start', fontWeight: 800 }} />}
                    <Box
                      sx={{ typography: 'body2', '& p': { my: 0.75 }, '& ul, & ol': { pl: 3 } }}
                      dangerouslySetInnerHTML={{ __html: reply.body }}
                    />
                    <CommunityImageGallery images={reply.images ?? []} title={`Reply by ${reply.author.name}`} detailsMode />
                    <ReactionBar
                      reactions={reply.reactions}
                      disabled={!user}
                      currentUserId={user?._id}
                      onReact={(type) => void onReactReply(reply._id, type)}
                    />
                  </Stack>
                </Box>
                {index < post.replies.length - 1 && <Divider />}
              </Fragment>
            );
          })}
          {hasMoreReplies && onLoadMoreReplies && (
            <Button
              variant="outlined"
              disabled={loadingMoreReplies}
              onClick={() => void onLoadMoreReplies()}
              sx={{
                alignSelf: 'center',
                px: 3,
                py: 1,
                borderRadius: 999,
                fontWeight: 900,
                textTransform: 'none',
                bgcolor: 'background.paper',
                boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
                '&:hover': {
                  bgcolor: 'primary.50',
                  boxShadow: '0 10px 26px rgba(37, 99, 235, 0.14)',
                },
              }}
            >
              {loadingMoreReplies ? 'Loading answers...' : 'Load more answers'}
            </Button>
          )}
        </Stack>
      </Box>
      </>
      )}
    </Paper>
  );
};

export default CommunityPostCard;
