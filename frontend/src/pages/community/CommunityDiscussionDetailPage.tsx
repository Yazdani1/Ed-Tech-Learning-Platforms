import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

const CommunityDiscussionDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<ICommunityPost | null>(null);
  const [badges, setBadges] = useState<ICommunityBadge[]>([]);
  const [channels, setChannels] = useState<ICommunityChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPost = async () => {
    if (!postId) return;
    setLoading(true);
    const res = await communityService.getPost(postId);
    setPost(res.data?.post ?? null);
    setBadges(res.data?.badges ?? []);
    setChannels(res.data?.channels ?? []);
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
    setPost((current) => (current ? { ...current, replies: [...current.replies, res.data as ICommunityReply] } : current));
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
              />
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
