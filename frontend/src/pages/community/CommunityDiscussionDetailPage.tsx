import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { useAuth } from '../../context/useAuth';
import { communityService } from '../../services/community.service';
import type {
  CommunityReactionType,
  ICommunityBadge,
  ICommunityChannel,
  ICommunityPost,
  ICommunityReply,
} from '../../types/index';
import CommunityPostCard from './CommunityPostCard';
import { formatCount, reactionOptions } from './communityHelpers';

const CommunityDiscussionDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<ICommunityPost | null>(null);
  const [badges, setBadges] = useState<ICommunityBadge[]>([]);
  const [channels, setChannels] = useState<ICommunityChannel[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<ICommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);

  const loadPost = async () => {
    if (!postId) return;
    setLoading(true);
    const res = await communityService.getPost(postId);
    const discussion = res.data?.post ?? null;
    setPost(discussion);
    setBadges(res.data?.badges ?? []);
    setChannels(res.data?.channels ?? []);
    setHasMoreReplies(Boolean(res.data?.repliesPagination?.hasMore));
    if (discussion?.channel?._id) {
      const relatedRes = await communityService.getOverview({ channel: discussion.channel._id, limit: 12 });
      setRelatedPosts((relatedRes.data?.posts ?? []).filter((item) => item._id !== discussion._id));
    } else {
      setRelatedPosts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadPost();
  }, [postId]);

  const updatePost = (updatedPost: ICommunityPost) => {
    setPost((current) => (current ? { ...current, ...updatedPost, replies: current.replies } : current));
  };

  const updateReply = (updatedReply: ICommunityReply) => {
    setPost((current) =>
      current
        ? {
            ...current,
            replies: current.replies.map((reply) => (reply._id === updatedReply._id ? updatedReply : reply)),
          }
        : current
    );
  };

  const createReply = async (discussionId: string, body: string) => {
    const res = await communityService.createReply(discussionId, body);
    if (!res.data) return;
    setPost((current) =>
      current
        ? {
            ...current,
            replies: [...current.replies, res.data as ICommunityReply],
            replyCount: (current.replyCount ?? current.replies.length) + 1,
          }
        : current
    );
  };

  const reactToPost = async (discussionId: string, type: CommunityReactionType) => {
    const res = await communityService.reactToPost(discussionId, type);
    if (res.data) updatePost(res.data);
  };

  const reactToReply = async (replyId: string, type: CommunityReactionType) => {
    const res = await communityService.reactToReply(replyId, type);
    if (res.data) updateReply(res.data);
  };

  const acceptReply = async (replyId: string) => {
    const res = await communityService.toggleAcceptedReply(replyId);
    if (res.data) updateReply(res.data);
  };

  const archivePost = async (discussionId: string) => {
    await communityService.archivePost(discussionId);
    navigate('/community-hub');
  };

  const togglePin = async (discussionId: string) => {
    const res = await communityService.togglePinnedPost(discussionId);
    if (res.data) updatePost(res.data);
  };

  const updatePostDetails = async (discussionId: string, data: FormData) => {
    const res = await communityService.updatePost(discussionId, data);
    if (res.data) await loadPost();
  };

  const loadMoreReplies = async () => {
    if (!post || loadingMoreReplies || !hasMoreReplies) return;
    setLoadingMoreReplies(true);
    try {
      const res = await communityService.getReplies(post._id, { skip: post.replies.length, limit: 10 });
      const nextReplies = res.data?.replies ?? [];
      setPost((current) =>
        current
          ? {
              ...current,
              replies: [...current.replies, ...nextReplies],
              replyCount: res.data?.total ?? current.replyCount,
            }
          : current
      );
      setHasMoreReplies(Boolean(res.data?.hasMore));
    } finally {
      setLoadingMoreReplies(false);
    }
  };

  const latestRelatedPosts = relatedPosts.slice(0, 5);
  const mostAnsweredPosts = [...relatedPosts]
    .sort((a, b) => b.replies.length - a.replies.length || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getTopReactionIcons = (item: ICommunityPost) =>
    reactionOptions
      .map((option) => ({
        ...option,
        count: item.reactions.filter((reaction) => reaction.type === option.type).length,
      }))
      .filter((option) => option.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

  const renderSidebarPosts = (items: ICommunityPost[]) =>
    items.length > 0 ? (
      <Stack spacing={1}>
        {items.map((item, index) => {
          const topReactions = getTopReactionIcons(item);

          return (
            <Box key={item._id}>
              <Box
                onClick={() => navigate(`/community-hub/${item._id}`)}
                sx={{
                  py: 1.25,
                  px: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'background-color 140ms ease',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                <Stack spacing={0.75}>
                  <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.35 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                    {item.author.name}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      {topReactions.length > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {topReactions.map((reaction, reactionIndex) => (
                            <Box
                              key={reaction.type}
                              component="span"
                              sx={{
                                width: 18,
                                height: 18,
                                display: 'grid',
                                placeItems: 'center',
                                ml: reactionIndex === 0 ? 0 : -0.5,
                                fontSize: 15,
                              }}
                            >
                              {reaction.icon}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <ThumbUpOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        {formatCount(item.reactions.length)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <ChatBubbleOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        {formatCount(item.replies.length)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              {index < items.length - 1 && <Divider />}
            </Box>
          );
        })}
      </Stack>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No other discussions in this channel yet.
      </Typography>
    );

  return (
    <>
      <PublicNavbar />
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Stack spacing={2.5}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/community-hub')} sx={{ alignSelf: 'flex-start' }}>
              Back to Community Hub
            </Button>

            {loading ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                Loading discussion...
              </Paper>
            ) : post ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5, alignItems: 'start' }}>
                <CommunityPostCard
                  post={post}
                  user={user}
                  badges={badges}
                  channels={channels}
                  onReply={createReply}
                  onReactPost={reactToPost}
                  onReactReply={reactToReply}
                  onAcceptReply={acceptReply}
                  onArchivePost={archivePost}
                  onTogglePin={togglePin}
                  onUpdatePost={updatePostDetails}
                  hasMoreReplies={hasMoreReplies}
                  loadingMoreReplies={loadingMoreReplies}
                  onLoadMoreReplies={loadMoreReplies}
                />
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        Latest in {post.channel.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        More discussions from this channel
                      </Typography>
                    </Box>
                    {renderSidebarPosts(latestRelatedPosts)}
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        Most answered
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active discussions from {post.channel.name}
                      </Typography>
                    </Box>
                    {renderSidebarPosts(mostAnsweredPosts)}
                  </Stack>
                </Paper>
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 900 }}>Discussion not found</Typography>
              </Paper>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default CommunityDiscussionDetailPage;
