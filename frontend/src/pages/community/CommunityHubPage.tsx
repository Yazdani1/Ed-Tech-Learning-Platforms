import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
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
  const channelScrollerRef = useRef<HTMLDivElement | null>(null);
  const [overview, setOverview] = useState<ICommunityOverview>({
    channels: [],
    posts: [],
    badges: [],
    channelPostCounts: {},
    totalPostCount: 0,
    totalReplyCount: 0,
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
    images: [] as File[],
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
    setOverview(res.data ?? { channels: [], posts: [], badges: [], channelPostCounts: {}, totalPostCount: 0, totalReplyCount: 0, guestLimited: false });
    setLoading(false);
  };

  useEffect(() => {
    void loadHub();
  }, [selectedChannel, showArchived, dateFrom, dateTo]);

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
    postForm.images.forEach((image) => data.append('images', image));
    await communityService.createPost(data);
    setPostForm({ channel: '', title: '', description: '', images: [] });
    setPostFormOpen(false);
    toast.success('Discussion created');
    await loadHub();
    setCreating(false);
  };

  const createReply = async (postId: string, data: FormData) => {
    const res = await communityService.createReply(postId, data);
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

  const archiveReply = async (replyId: string) => {
    await communityService.archiveReply(replyId);
    setOverview((current) => ({
      ...current,
      posts: current.posts.map((post) => ({
        ...post,
        replies: post.replies.filter((reply) => reply._id !== replyId),
      })),
    }));
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

  const clearFilters = () => {
    setFilterChannel('');
    setSelectedChannel('');
    setDateFrom('');
    setDateTo('');
    setShowArchived(false);
  };

  const toggleFilters = () => {
    if (filtersOpen) {
      clearFilters();
      setFiltersOpen(false);
      return;
    }
    setFiltersOpen(true);
  };

  const addPostImages = (files: FileList | null) => {
    if (!files) return;
    setPostForm((current) => ({ ...current, images: [...current.images, ...Array.from(files)] }));
  };

  const removePostImage = (index: number) => {
    setPostForm((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const activeFilterCount = [selectedChannel, dateFrom, dateTo, canViewArchive && showArchived ? 'archive' : ''].filter(Boolean).length;
  const filterButtonLabel = `${filtersOpen ? 'Hide filters' : 'Show filters'}${activeFilterCount ? ` (${activeFilterCount})` : ''}`;

  const scrollChannels = (direction: 'left' | 'right') => {
    channelScrollerRef.current?.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <>
      <PublicNavbar />
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Stack spacing={3}>
            {overview.guestLimited && (
              <Alert severity="info">
                You are viewing a limited guest preview. Sign in to read more discussions and join the conversation.
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <IconButton aria-label="Previous channels" onClick={() => scrollChannels('left')} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <Box ref={channelScrollerRef} sx={{ display: 'flex', gap: 1.5, overflow: 'hidden', scrollBehavior: 'smooth', flex: 1, py: 0.5 }}>
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
                      bgcolor: !selectedChannel ? 'primary.main' : '#334155',
                      border: '2px solid',
                      borderColor: !selectedChannel ? 'primary.light' : 'transparent',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                      All Channels
                    </Typography>
                    <Typography sx={{ mt: 1, fontWeight: 900 }}>{overview.totalPostCount ?? 0} posts</Typography>
                    <Typography sx={{ fontWeight: 900 }}>{overview.totalReplyCount ?? 0} replies</Typography>
                  </Paper>

                  {overview.channels.map((channel: ICommunityChannel, index) => {
                    const colors = ['#0f766e', '#7c3aed', '#dc2626', '#2563eb', '#ca8a04', '#be185d'];
                    const active = selectedChannel === channel._id;
                    const color = colors[index % colors.length];

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
                          bgcolor: color,
                          border: '2px solid',
                          borderColor: active ? 'common.white' : 'transparent',
                          backgroundImage: channel.imageUrl
                            ? `linear-gradient(90deg, rgba(15,23,42,.76), rgba(15,23,42,.42)), url(${channel.imageUrl})`
                            : `linear-gradient(135deg, ${color}, rgba(15, 23, 42, 0.78))`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          boxShadow: active ? '0 10px 24px rgba(15, 23, 42, 0.18)' : 'none',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                          {channel.name}
                        </Typography>
                        <Typography sx={{ mt: 1, fontWeight: 900 }}>{overview.channelPostCounts[channel._id] ?? 0} posts</Typography>
                      </Paper>
                    );
                  })}
                </Box>
                <IconButton aria-label="Next channels" onClick={() => scrollChannels('right')} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end', alignItems: { xs: 'stretch', md: 'center' } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {isAdminRole(user?.role) && (
                      <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setAdminOpen(true)}>
                        Community Settings
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TuneIcon />}
                      endIcon={
                        <ExpandMoreIcon
                          sx={{
                            transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      }
                      onClick={toggleFilters}
                    >
                      {filterButtonLabel}
                    </Button>
                    {user && (
                      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setPostFormOpen((value) => !value)}>
                        New Discussion
                      </Button>
                    )}
                    {!user && <Button href="/auth/login" variant="contained">Sign in to participate</Button>}
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    display: filtersOpen ? 'block' : 'none',
                    pt: 2,
                    mt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Channel</InputLabel>
                        <Select
                          label="Channel"
                          value={filterChannel}
                          onChange={(event) => {
                            setFilterChannel(event.target.value);
                            setSelectedChannel(event.target.value);
                          }}
                        >
                          <MenuItem value="">All channels</MenuItem>
                          {overview.channels.map((channel) => (
                            <MenuItem key={channel._id} value={channel._id}>
                              {channel.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField size="small" fullWidth label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField size="small" fullWidth label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    {canViewArchive && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button fullWidth variant={showArchived ? 'contained' : 'outlined'} onClick={() => setShowArchived((value) => !value)}>
                          {showArchived ? 'Archive on' : 'Archive off'}
                        </Button>
                      </Grid>
                    )}
                    {activeFilterCount > 0 && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button fullWidth variant="text" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>

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
                        Upload images
                        <input hidden multiple type="file" accept="image/*" onChange={(event) => addPostImages(event.target.files)} />
                      </Button>
                      {postForm.images.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          {postForm.images.map((image, index) => (
                            <Chip
                              key={`${image.name}-${index}`}
                              label={image.name}
                              onDelete={() => removePostImage(index)}
                              deleteIcon={<CloseIcon />}
                              variant="outlined"
                              sx={{ maxWidth: 280 }}
                            />
                          ))}
                        </Stack>
                      )}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
                        <Button
                          variant="contained"
                          disabled={creating || !postForm.channel || !postForm.title.trim() || isRichTextEmpty(postForm.description)}
                          onClick={() => void createPost()}
                        >
                          Publish Discussion
                        </Button>
                        <Button onClick={() => setPostFormOpen(false)}>
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )}

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
                      onArchiveReply={archiveReply}
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
