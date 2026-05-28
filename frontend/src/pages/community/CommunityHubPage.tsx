import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import UploadIcon from '@mui/icons-material/Upload';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import toast from 'react-hot-toast';
import PublicNavbar from '../../components/layout/PublicNavbar';
import RichTextEditor from '../../components/course/RichTextEditor';
import { useAuth } from '../../context/useAuth';
import { communityService } from '../../services/community.service';
import type { CommunityReactionType, ICommunityOverview, ICommunityPost, ICommunityReply } from '../../types/index';
import CommunityAdminModal from './CommunityAdminModal';
import CommunityPostCard from './CommunityPostCard';
import CommunityRightSidebar from './CommunityRightSidebar';
import { isAdminRole, isRichTextEmpty } from './communityHelpers';

const numberFormatter = new Intl.NumberFormat();

const CommunityHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState<ICommunityOverview>({
    channels: [],
    posts: [],
    badges: [],
    channelPostCounts: {},
    channelReplyCounts: {},
    totalPostCount: 0,
    resultPostCount: 0,
    totalReplyCount: 0,
    totalMemberCount: 0,
    guestLimited: false,
  });
  const [selectedChannel, setSelectedChannel] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
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

  const loadHub = async (searchOverride?: string) => {
    setLoading(true);
    const searchValue = searchOverride ?? appliedSearch;
    const res = await communityService.getOverview({
      channel: selectedChannel || undefined,
      archived: canViewArchive && showArchived,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: searchValue || undefined,
    });
    setOverview(res.data ?? { channels: [], posts: [], badges: [], channelPostCounts: {}, channelReplyCounts: {}, totalPostCount: 0, resultPostCount: 0, totalReplyCount: 0, totalMemberCount: 0, guestLimited: false });
    setLoading(false);
  };

  useEffect(() => {
    void loadHub();
  }, [selectedChannel, showArchived, dateFrom, dateTo]);

  useEffect(() => {
    if (searchText.trim() === '' && appliedSearch) {
      setAppliedSearch('');
      void loadHub('');
    }
  }, [searchText, appliedSearch]);

  const submitSearch = () => {
    const nextSearch = searchText.trim();
    if (!nextSearch) return;
    setAppliedSearch(nextSearch);
    void loadHub(nextSearch);
  };

  const clearSearch = () => {
    setSearchText('');
    if (appliedSearch) {
      setAppliedSearch('');
      void loadHub('');
    }
  };

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
  const searchedText = appliedSearch.trim();
  const headerTitle = overview.settings?.title || 'Community Hub';
  const headerDescription = overview.settings?.description || 'Find study questions, tech discussions, accepted answers, reactions, points, and badges.';
  const headerImage = overview.settings?.headerImageUrl || 'https://picsum.photos/seed/community-hub-header/1800/520';
  const selectedChannelInfo = overview.channels.find((channel) => channel._id === selectedChannel);
  const selectedChannelName = selectedChannelInfo?.name ?? 'All Channels';
  const selectedChannelPostCount = selectedChannel ? overview.channelPostCounts[selectedChannel] ?? 0 : overview.totalPostCount ?? 0;
  const stats = [
    { label: 'Total Members', value: overview.totalMemberCount ?? 0, icon: GroupsOutlinedIcon },
    { label: 'Discussion Questions', value: overview.totalPostCount ?? 0, icon: ForumOutlinedIcon },
    { label: 'Answers', value: overview.totalReplyCount ?? 0, icon: QuestionAnswerOutlinedIcon },
  ];

  return (
    <>
      <PublicNavbar />
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 4 }}>
        <Box
          sx={{
            width: '100%',
            minHeight: { xs: 320, md: 390 },
            display: 'flex',
            alignItems: 'center',
            backgroundImage: `linear-gradient(90deg, rgba(8, 20, 38, 0.72), rgba(8, 20, 38, 0.48)), url("${headerImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'common.white',
            mb: 4,
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
            <Stack spacing={3} sx={{ maxWidth: 980, mx: 'auto', py: { xs: 5, md: 7 }, alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ maxWidth: 860 }}>
                <Typography variant="h3" sx={{ fontWeight: 950, mb: 1, fontSize: { xs: 34, md: 52 }, lineHeight: 1.08 }}>
                  {headerTitle}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: { xs: 16, md: 19 }, maxWidth: 760, mx: 'auto' }}>
                  {headerDescription}
                </Typography>
              </Box>
              <Paper
                elevation={0}
                component="form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                  gap: 0,
                  p: { xs: 0.75, sm: 0 },
                  borderRadius: 999,
                  maxWidth: 860,
                  width: '100%',
                  bgcolor: 'rgba(255,255,255,0.96)',
                  overflow: 'hidden',
                  boxShadow: '0 18px 38px rgba(0, 0, 0, 0.2)',
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search discussions..."
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                      endAdornment: searchText ? (
                        <InputAdornment position="end">
                          <IconButton aria-label="Clear search" size="small" onClick={clearSearch} edge="end">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'transparent',
                      minHeight: 62,
                      borderRadius: 999,
                      pr: { sm: 2 },
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: 'transparent' },
                      '&.Mui-focused fieldset': { borderColor: 'transparent' },
                    },
                    '& .MuiInputBase-input': {
                      py: 2,
                    },
                  }}
                />
                <Button
                  type="button"
                  variant="contained"
                  onClick={submitSearch}
                  sx={{
                    px: { xs: 3, sm: 4.5 },
                    minHeight: { xs: 54, sm: 62 },
                    borderRadius: { xs: 999, sm: 0 },
                    fontWeight: 900,
                    textTransform: 'none',
                    boxShadow: 'none',
                    background: 'linear-gradient(135deg, #f57c00 0%, #ffb300 52%, #ec407a 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ef6c00 0%, #ffa000 48%, #d81b60 100%)',
                      boxShadow: 'none',
                    },
                    transition: 'background 0.18s ease',
                  }}
                >
                  Search
                </Button>
              </Paper>
            </Stack>
          </Container>
        </Box>
        <Container maxWidth={false} sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Stack spacing={3}>
            {overview.guestLimited && (
              <Alert severity="info">
                You are viewing a limited guest preview. Sign in to read more discussions and join the conversation.
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: { xs: 2, md: 3 }, py: 2, bgcolor: 'background.paper' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.5, sm: 3, md: 6 }}
                  sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap' }}
                >
                  {stats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Stack key={item.label} direction="row" spacing={1.1} sx={{ alignItems: 'center', minWidth: { xs: 'auto', sm: 190 } }}>
                        <Icon sx={{ color: 'text.primary', fontSize: 28 }} />
                        <Typography sx={{ fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap' }}>
                          {numberFormatter.format(item.value)} {item.label}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>

              <Box>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
                    <Typography sx={{ fontWeight: 950, fontSize: { xs: 20, md: 24 }, alignSelf: { md: 'center' } }}>
                      {selectedChannelName} ({numberFormatter.format(selectedChannelPostCount)})
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {searchedText && (
                      <Typography sx={{ fontWeight: 900, color: 'text.primary', alignSelf: 'center', mr: { sm: 0.5 } }}>
                        Search results ({numberFormatter.format(overview.resultPostCount ?? overview.posts.length)})
                      </Typography>
                    )}
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

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '290px minmax(0, 1fr) 330px' }, gap: 2.5, alignItems: 'start' }}>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper' }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      Channels
                    </Typography>
                  </Box>
                  <Divider />
                  <Tooltip
                    arrow
                    placement="right"
                    title={
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>All Channels</Typography>
                        <Typography variant="caption">{numberFormatter.format(overview.totalPostCount ?? 0)} discussions</Typography>
                        <Typography variant="caption">{numberFormatter.format(overview.totalReplyCount ?? 0)} answers</Typography>
                      </Stack>
                    }
                  >
                    <Box
                      onClick={() => {
                        setSelectedChannel('');
                        setFilterChannel('');
                      }}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '44px minmax(0, 1fr) auto',
                        gap: 1.25,
                        alignItems: 'center',
                        p: 1.5,
                        cursor: 'pointer',
                        borderLeft: '4px solid',
                        borderLeftColor: selectedChannel ? 'transparent' : 'primary.main',
                        bgcolor: selectedChannel ? 'transparent' : 'primary.50',
                        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                        '&:hover': {
                          bgcolor: selectedChannel ? 'grey.50' : 'primary.50',
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Avatar variant="rounded" sx={{ bgcolor: 'primary.main' }}>A</Avatar>
                      <Typography sx={{ fontWeight: 900 }}>All Channels</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                        {numberFormatter.format(overview.totalPostCount ?? 0)}
                      </Typography>
                    </Box>
                  </Tooltip>
                  <Divider />
                  {overview.channels.map((channel, index) => {
                    const active = selectedChannel === channel._id;
                    const postCount = overview.channelPostCounts[channel._id] ?? 0;
                    const answerCount = overview.channelReplyCounts?.[channel._id] ?? 0;
                    return (
                      <Box key={channel._id}>
                        <Tooltip
                          arrow
                          placement="right"
                          title={
                            <Stack spacing={0.6} sx={{ maxWidth: 240 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{channel.name}</Typography>
                              {channel.description && (
                                <Typography variant="caption" sx={{ color: 'grey.100' }}>
                                  {channel.description}
                                </Typography>
                              )}
                              <Stack direction="row" spacing={1.5}>
                                <Typography variant="caption">{numberFormatter.format(postCount)} discussions</Typography>
                                <Typography variant="caption">{numberFormatter.format(answerCount)} answers</Typography>
                              </Stack>
                            </Stack>
                          }
                        >
                          <Box
                            onClick={() => {
                              setSelectedChannel(channel._id);
                              setFilterChannel(channel._id);
                            }}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '44px minmax(0, 1fr) auto',
                              gap: 1.25,
                              alignItems: 'center',
                              p: 1.5,
                              cursor: 'pointer',
                              borderLeft: '4px solid',
                              borderLeftColor: active ? 'primary.main' : 'transparent',
                              bgcolor: active ? 'primary.50' : 'transparent',
                              transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                              '&:hover': {
                                bgcolor: active ? 'primary.50' : 'grey.50',
                                transform: 'translateX(2px)',
                              },
                            }}
                          >
                            <Avatar src={channel.imageUrl} variant="rounded">{channel.name[0]}</Avatar>
                            <Typography sx={{ fontWeight: 900 }} noWrap>{channel.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                              {numberFormatter.format(postCount)}
                            </Typography>
                          </Box>
                        </Tooltip>
                        {index < overview.channels.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Paper>

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
                <CommunityRightSidebar widgets={overview.widgets} badges={overview.badges} />
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>
      {isAdminRole(user?.role) && <CommunityAdminModal open={adminOpen} onClose={() => setAdminOpen(false)} onChanged={() => void loadHub()} />}
    </>
  );
};

export default CommunityHubPage;
