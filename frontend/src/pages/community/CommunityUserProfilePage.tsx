import { useEffect, useState, type FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Box, Button, Chip, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { communityService } from '../../services/community.service';
import type { ICommunityAnswerReply, ICommunityPost, ICommunityReply, ICommunityUserProfile } from '../../types/index';
import { formatCount } from './communityHelpers';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

type AnswerItem = NonNullable<ICommunityUserProfile['answers']>[number];
type AnswerPostRef = Pick<ICommunityPost, '_id' | 'title' | 'channel' | 'isArchived'>;

const plainText = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const StatCard: FC<StatCardProps> = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      height: '100%',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
      boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
    }}
  >
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="h5" sx={{ fontWeight: 950 }}>
      {typeof value === 'number' ? formatCount(value) : value}
    </Typography>
  </Paper>
);

const getAnswerPost = (answer: AnswerItem): AnswerPostRef | null => {
  const post = (answer as ICommunityReply & { post?: string | AnswerPostRef }).post;
  if (post && typeof post === 'object') return post;
  return ((answer as ICommunityAnswerReply & { reply?: { post?: AnswerPostRef } }).reply?.post ?? null);
};

const CommunityUserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ICommunityUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    communityService
      .getUserProfile(userId)
      .then((res) => setProfile(res.data ?? null))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <>
      <PublicNavbar />
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/community-hub')} sx={{ alignSelf: 'flex-start' }}>
            Back to Community Hub
          </Button>

          {loading ? (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              Loading profile...
            </Paper>
          ) : !profile ? (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              Profile not found
            </Paper>
          ) : profile.isPrivate ? (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Avatar src={profile.user.avatar} sx={{ width: 84, height: 84, mx: 'auto', mb: 2 }}>
                {profile.user.name[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                This profile is private.
              </Typography>
            </Paper>
          ) : (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  color: 'common.white',
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'linear-gradient(135deg, #0f766e 0%, #1565c0 48%, #7c3aed 100%)',
                  boxShadow: '0 24px 60px rgba(21, 101, 192, 0.22)',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 82% 18%, rgba(255,255,255,0.22), transparent 26%)',
                  },
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, position: 'relative' }}>
                  <Avatar
                    src={profile.user.avatar}
                    sx={{
                      width: 118,
                      height: 118,
                      bgcolor: 'primary.main',
                      fontSize: 42,
                      border: '5px solid rgba(255,255,255,0.88)',
                      boxShadow: '0 20px 44px rgba(0,0,0,0.22)',
                    }}
                  >
                    {profile.user.name[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 950 }}>
                      {profile.user.name}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.75, maxWidth: 720 }}>
                      Community member profile, discussions, answers, badges, and reaction activity.
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={profile.user.role} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white', fontWeight: 900 }} />
                      <Chip label={`${formatCount(profile.user.communityPoints ?? 0)} pts`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white', fontWeight: 900 }} />
                      {profile.user.createdAt && <Chip label={`Member since ${new Date(profile.user.createdAt).toLocaleDateString()}`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white', fontWeight: 900 }} />}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard label="Discussions asked" value={profile.stats?.discussionsAsked ?? 0} icon={<ForumOutlinedIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard label="Answers/replies" value={profile.stats?.answersGiven ?? 0} icon={<ChatBubbleOutlinedIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard label="Reactions received" value={profile.stats?.reactionsReceived ?? 0} icon={<ThumbUpOutlinedIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard label="Reactions given" value={profile.stats?.reactionsGiven ?? 0} icon={<ThumbUpOutlinedIcon />} />
                </Grid>
              </Grid>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Stack spacing={2.5}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                        Discussions
                      </Typography>
                      <Stack divider={<Divider />} spacing={0}>
                        {(profile.discussions ?? []).map((post) => (
                          <Box key={post._id} onClick={() => navigate(`/community-hub/${post._id}`)} sx={{ py: 1.35, cursor: 'pointer', '&:hover h6': { color: 'primary.main' } }}>
                            <Typography component="h6" sx={{ fontWeight: 900 }}>
                              {post.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {post.channel.name} - {new Date(post.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        ))}
                        {(profile.discussions ?? []).length === 0 && <Typography color="text.secondary">No discussions yet.</Typography>}
                      </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                        Answers and Replies
                      </Typography>
                      <Stack divider={<Divider />} spacing={0}>
                        {(profile.answers ?? []).map((answer) => {
                          const post = getAnswerPost(answer);
                          return (
                            <Box
                              key={answer._id}
                              onClick={() => post?._id && navigate(`/community-hub/${post._id}`)}
                              sx={{ py: 1.35, cursor: post?._id ? 'pointer' : 'default', '&:hover h6': { color: post?._id ? 'primary.main' : undefined } }}
                            >
                              <Typography component="h6" sx={{ fontWeight: 900 }}>
                                {post?.title ?? 'Reply'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {plainText(answer.body).slice(0, 180)}
                              </Typography>
                            </Box>
                          );
                        })}
                        {(profile.answers ?? []).length === 0 && <Typography color="text.secondary">No answers yet.</Typography>}
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
                      Badges
                    </Typography>
                    <Stack spacing={1}>
                      {(profile.badges ?? []).map((badge) => (
                        <Stack key={badge._id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Avatar src={badge.imageUrl} variant="rounded" sx={{ bgcolor: 'success.light' }}>
                            <EmojiEventsOutlinedIcon />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 900 }}>{badge.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCount(badge.requiredPoints)} pts
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                      {(profile.badges ?? []).length === 0 && <Typography color="text.secondary">No badges earned yet.</Typography>}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Stack>
        </Container>
      </Box>
    </>
  );
};

export default CommunityUserProfilePage;
