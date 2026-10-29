import { useEffect, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, Chip, Divider, Paper, Popover, Stack, Typography } from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { communityService } from '../../services/community.service';
import type { ICommunityUserProfile } from '../../types/index';

interface CommunityProfilePreviewPopoverProps {
  anchorEl: HTMLElement | null;
  userId?: string;
  onClose: () => void;
}

const numberFormatter = new Intl.NumberFormat();

const CommunityProfilePreviewPopover: FC<CommunityProfilePreviewPopoverProps> = ({ anchorEl, userId, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ICommunityUserProfile | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | undefined>();
  const open = Boolean(anchorEl && userId);
  const loading = Boolean(open && userId && loadedUserId !== userId);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let active = true;
    communityService
      .getUserProfile(userId)
      .then((res) => {
        if (!active) return;
        setProfile(res.data ?? null);
        setLoadedUserId(userId);
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
        setLoadedUserId(userId);
      });

    return () => {
      active = false;
    };
  }, [open, userId]);

  const viewProfile = () => {
    if (!userId) return;
    onClose();
    navigate(`/community-hub/users/${userId}`);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
      transformOrigin={{ vertical: 'center', horizontal: 'right' }}
      slotProps={{ paper: { sx: { borderRadius: 1, boxShadow: '0 18px 44px rgba(15, 23, 42, 0.24)' } } }}
    >
      <Box sx={{ width: 340, maxWidth: 'calc(100vw - 32px)', bgcolor: 'background.paper' }}>
        {loading ? (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
            Loading profile...
          </Paper>
        ) : !profile ? (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
            Profile not found
          </Paper>
        ) : profile.isPrivate ? (
          <Stack spacing={2} sx={{ alignItems: 'center', p: 3 }}>
            <Avatar src={profile.user.avatar} sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: 36 }}>
              {profile.user.name[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 950, textAlign: 'center' }}>
              This profile is private.
            </Typography>
            <Button
              variant="outlined"
              onClick={viewProfile}
              sx={{
                px: 4,
                fontWeight: 900,
                textTransform: 'none',
                '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText', borderColor: 'primary.main' },
              }}
            >
              View Profile
            </Button>
          </Stack>
        ) : (
          <>
            <Stack spacing={2} sx={{ alignItems: 'center', p: 3 }}>
              <Avatar
                src={profile.user.avatar}
                sx={{ width: 118, height: 118, bgcolor: 'primary.main', fontSize: 42, border: '1px solid', borderColor: 'divider' }}
              >
                {profile.user.name[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 950 }}>
                  {profile.user.name}
                </Typography>
                <Chip label={profile.user.role} size="small" variant="outlined" sx={{ mt: 1 }} />
              </Box>
              <Button
                variant="outlined"
                size="large"
                onClick={viewProfile}
                sx={{
                  px: 4,
                  fontWeight: 900,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText', borderColor: 'primary.main' },
                }}
              >
                View Profile
              </Button>
            </Stack>
            <Divider />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ p: 2.25, textAlign: 'center', '&:hover .profile-preview-count-text': { color: 'primary.main' } }}>
                <Typography className="profile-preview-count-text" variant="h4" sx={{ fontWeight: 400 }}>
                  {numberFormatter.format(profile.stats?.discussionsAsked ?? 0)}
                </Typography>
                <Typography className="profile-preview-count-text" sx={{ fontWeight: 800 }}>
                  Discussions
                </Typography>
              </Box>
              <Box sx={{ p: 2.25, textAlign: 'center', borderLeft: '1px solid', borderColor: 'divider', '&:hover .profile-preview-count-text': { color: 'primary.main' } }}>
                <Typography className="profile-preview-count-text" variant="h4" sx={{ fontWeight: 400 }}>
                  {numberFormatter.format(profile.stats?.answersGiven ?? 0)}
                </Typography>
                <Typography className="profile-preview-count-text" sx={{ fontWeight: 800 }}>
                  Answered
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2.25 }}>
              {(profile.badges ?? []).length > 0 ? (
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                  {(profile.badges ?? []).slice(0, 6).map((badge) => (
                    <Chip
                      key={badge._id}
                      size="small"
                      avatar={badge.imageUrl ? <Avatar src={badge.imageUrl} /> : <Avatar><EmojiEventsOutlinedIcon fontSize="small" /></Avatar>}
                      label={badge.name}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No badges earned yet.
                </Typography>
              )}
            </Box>
            <Divider />
            <Stack direction="row" spacing={1} sx={{ p: 2.25, justifyContent: 'center', color: 'text.secondary' }}>
              {profile.user.createdAt && (
                <Typography variant="body2">
                  Joined: {new Date(profile.user.createdAt).toLocaleDateString()}
                </Typography>
              )}
              <Typography variant="body2">Points: {numberFormatter.format(profile.user.communityPoints ?? 0)}</Typography>
            </Stack>
          </>
        )}
      </Box>
    </Popover>
  );
};

export default CommunityProfilePreviewPopover;
