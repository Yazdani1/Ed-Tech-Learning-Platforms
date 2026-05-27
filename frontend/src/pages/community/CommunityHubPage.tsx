import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ForumIcon from '@mui/icons-material/Forum';
import SettingsIcon from '@mui/icons-material/Settings';
import UploadIcon from '@mui/icons-material/Upload';
import toast from 'react-hot-toast';
import PublicNavbar from '../../components/layout/PublicNavbar';
import RichTextEditor from '../../components/course/RichTextEditor';
import { useAuth } from '../../context/useAuth';
import { communityService } from '../../services/community.service';
import type { CommunityReactionType, ICommunityChannel, ICommunityOverview, ICommunityPost, ICommunityReply } from '../../types/index';
import CommunityAdminModal from './CommunityAdminModal';
import CommunityPostCard from './CommunityPostCard';
import { isAdminRole, isRichTextEmpty } from './communityHelpers';

const CommunityHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState<ICommunityOverview>({
    channels: [],
    posts: [],
    badges: [],
    channelPostCounts: {},
    guestLimited: false,
  });
  const [selectedChannel, setSelectedChannel] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [postForm, setPostForm] = useState({
    channel: '',
    title: '',
    description: '',
    image: null as File | null,
  });

  const canViewArchive = isAdminRole(user?.role);

  const loadHub = async () => {
    setLoading(true);
    const res = await communityService.getOverview({
      channel: selectedChannel || undefined,
      archived: canViewArchive && showArchived,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setOverview(res.data ?? { channels: [], posts: [], badges: [], channelPostCounts: {}, guestLimited: false });
    setLoading(false);
  };

  useEffect(() => {
    void loadHub();
  }, [selectedChannel, showArchived, dateFrom, dateTo]);

  const selectedChannelName = useMemo(
    () => overview.channels.find((channel) => channel._id === selectedChannel)?.name ?? 'All channels',
    [overview.channels, selectedChannel]
  );

  const updatePost = (updatedPost: ICommunityPost) => {
    setOverview((current) => ({
      ...current,
      posts: current.posts.map((post) => (post._id === updatedPost._id ? { ...post, ...updatedPost, replies: post.replies } : post)),
    }));
  };

  const updateReply = (updatedReply: ICommunityReply) => {
    setOverview((current) => ({
      ...current,
      posts: current.posts.map((post) => ({
        ...post,
        replies: post.replies.map((reply) => (reply._id === updatedReply._id ? updatedReply : reply)),
      })),
    }));
  };

  const createPost = async () => {
    if (!postForm.channel || !postForm.title.trim() || isRichTextEmpty(postForm.description)) return;
    setCreating(true);
    const data = new FormData();
    data.append('channel', postForm.channel);
    data.append('title', postForm.title);
    data.append('description', postForm.description);
    if (postForm.image) data.append('image', postForm.image);
    await communityService.createPost(data);
    setPostForm({ channel: '', title: '', description: '', image: null });
    setPostFormOpen(false);
    toast.success('Discussion created');
    await loadHub();
    setCreating(false);
  };

  const createReply = async (postId: string, body: string) => {
    const res = await communityService.createReply(postId, body);
    if (!res.data) return;
    setOverview((current) => ({
      ...current,
      posts: current.posts.map((post) => (post._id === postId ? { ...post, replies: [...post.replies, res.data as ICommunityReply] } : post)),
    }));
  };

  const reactToPost = async (postId: string, type: CommunityReactionType) => {
    const res = await communityService.reactToPost(postId, type);
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

  const archivePost = async (postId: string) => {
    await communityService.archivePost(postId);
    setOverview((current) => ({ ...current, posts: current.posts.filter((post) => post._id !== postId) }));
  };

  const togglePin = async (postId: string) => {
    const res = await communityService.togglePinnedPost(postId);
    if (res.data) await loadHub();
  };

  const updatePostDetails = async (postId: string, data: FormData) => {
    const res = await communityService.updatePost(postId, data);
    if (res.data) await loadHub();
  };

  const applyFilters = () => {
    setSelectedChannel(filterChannel);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilterChannel('');
    setSelectedChannel('');
    setDateFrom('');
    setDateTo('');
    setShowArchived(false);
  };

  return (
    <>
      <PublicNavbar />
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <ForumIcon color="primary" />
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      Community Hub
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    Study questions, tech discussions, accepted answers, reactions, points, and badges.
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {isAdminRole(user?.role) && (
                    <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setAdminOpen(true)}>
                      Community Settings
                    </Button>
                  )}
                  {!user && <Button href="/auth/login" variant="contained">Sign in to participate</Button>}
                </Stack>
              </Stack>
            </Paper>

            {overview.guestLimited && (
              <Alert severity="info">
                You are viewing a limited guest preview. Sign in to read more discussions and join the conversation.
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
                <Paper
                  elevation={0}
                  onClick={() => {
                    setSelectedChannel('');
                    setFilterChannel('');
                  }}
                  sx={{
                    minWidth: 230,
                    p: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    color: 'common.white',
                    bgcolor: !selectedChannel ? 'primary.main' : 'grey.900',
                    border: '2px solid',
                    borderColor: !selectedChannel ? 'primary.light' : 'transparent',
                  }}
                >
                  <Typography variant="overline" sx={{ color: 'inherit', fontWeight: 900 }}>
                    All Channels
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    Recent discussions
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>{overview.posts.length} shown now</Typography>
                </Paper>

                {overview.channels.map((channel: ICommunityChannel, index) => {
                  const colors = ['#0f766e', '#7c3aed', '#dc2626', '#2563eb', '#ca8a04', '#be185d'];
                  const active = selectedChannel === channel._id;

                  return (
                    <Paper
                      key={channel._id}
                      elevation={0}
                      onClick={() => {
                        setSelectedChannel(channel._id);
                        setFilterChannel(channel._id);
                      }}
                      sx={{
                        minWidth: 260,
                        p: 2,
                        borderRadius: 1,
                        cursor: 'pointer',
                        color: 'common.white',
                        bgcolor: active ? colors[index % colors.length] : '#1f2937',
                        border: '2px solid',
                        borderColor: active ? 'common.white' : 'transparent',
                        backgroundImage: channel.imageUrl
                          ? `linear-gradient(90deg, rgba(15,23,42,.88), rgba(15,23,42,.62)), url(${channel.imageUrl})`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <Typography variant="overline" sx={{ color: 'inherit', fontWeight: 900 }}>
                        Channel
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                        {channel.name}
                      </Typography>
                      <Typography sx={{ opacity: 0.9 }}>{overview.channelPostCounts[channel._id] ?? 0} posts</Typography>
                    </Paper>
                  );
                })}
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end', alignItems: { xs: 'stretch', md: 'center' } }}>
                <Chip label={selectedChannelName} color="primary" variant="outlined" />
                {(dateFrom || dateTo) && <Chip label={`${dateFrom || 'Any day'} to ${dateTo || 'Any day'}`} />}
                <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFiltersOpen((value) => !value)}>
                  Filter
                </Button>
                {user && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setPostFormOpen((value) => !value)}>
                    New Discussion
                  </Button>
                )}
              </Stack>

              <Collapse in={filtersOpen}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel>Channel</InputLabel>
                      <Select label="Channel" value={filterChannel} onChange={(event) => setFilterChannel(event.target.value)}>
                        <MenuItem value="">All channels</MenuItem>
                        {overview.channels.map((channel) => (
                          <MenuItem key={channel._id} value={channel._id}>
                            {channel.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField size="small" label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField size="small" label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    {canViewArchive && (
                      <Button variant={showArchived ? 'contained' : 'outlined'} onClick={() => setShowArchived((value) => !value)}>
                        {showArchived ? 'Archive on' : 'Archive off'}
                      </Button>
                    )}
                    <Button variant="contained" onClick={applyFilters}>
                      Apply
                    </Button>
                    <Button onClick={clearFilters}>Clear</Button>
                  </Stack>
                </Paper>
              </Collapse>

              <Stack spacing={2.5}>
                {postFormOpen && user && (
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Start a discussion
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel>Channel</InputLabel>
                        <Select label="Channel" value={postForm.channel} onChange={(event) => setPostForm({ ...postForm, channel: event.target.value })}>
                          {overview.channels.map((channel) => (
                            <MenuItem key={channel._id} value={channel._id}>
                              {channel.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField label="Title" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} />
                      <RichTextEditor
                        value={postForm.description}
                        onChange={(description) => setPostForm({ ...postForm, description })}
                        placeholder="Describe the topic, question, or idea..."
                        minHeight={180}
                      />
                      <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ alignSelf: 'flex-start' }}>
                        Upload optional image
                        <input hidden type="file" accept="image/*" onChange={(event) => setPostForm({ ...postForm, image: event.target.files?.[0] ?? null })} />
                      </Button>
                      <Button
                        variant="contained"
                        disabled={creating || !postForm.channel || !postForm.title.trim() || isRichTextEmpty(postForm.description)}
                        onClick={() => void createPost()}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Publish Discussion
                      </Button>
                    </Stack>
                  </Paper>
                )}

                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {showArchived ? 'Archived discussions' : selectedChannelName}
                  </Typography>
                  <Chip label={`${overview.posts.length} shown`} />
                </Stack>

                {loading ? (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                    Loading discussions...
                  </Paper>
                ) : overview.posts.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontWeight: 900 }}>No discussions found</Typography>
                    <Typography color="text.secondary">Pick another channel or start a new discussion.</Typography>
                  </Paper>
                ) : (
                  overview.posts.map((post) => (
                    <CommunityPostCard
                      key={post._id}
                      post={post}
                      user={user}
                      badges={overview.badges}
                      onReply={createReply}
                      onReactPost={reactToPost}
                      onReactReply={reactToReply}
                      onAcceptReply={acceptReply}
                      onArchivePost={archivePost}
                      onTogglePin={togglePin}
                      onUpdatePost={updatePostDetails}
                      channels={overview.channels}
                      showReplies={false}
                      onOpen={(postId) => navigate(`/community-hub/${postId}`)}
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>
      {isAdminRole(user?.role) && <CommunityAdminModal open={adminOpen} onClose={() => setAdminOpen(false)} onChanged={() => void loadHub()} />}
    </>
  );
};

export default CommunityHubPage;
