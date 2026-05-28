import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Box, Button, Chip, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import type { ICommunityBadge, ICommunityHubWidgets } from '../../types/index';
import { formatCount } from './communityHelpers';

interface CommunityRightSidebarProps {
  widgets?: ICommunityHubWidgets;
  badges: ICommunityBadge[];
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

const SectionCard: FC<SectionCardProps> = ({ title, children }) => (
  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const CommunityRightSidebar: FC<CommunityRightSidebarProps> = ({ widgets, badges }) => {
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <SectionCard title="Most Answered Questions">
        <Stack divider={<Divider />} spacing={0}>
          {(widgets?.mostAnsweredPosts ?? []).slice(0, 5).map((post) => (
            <Box
              key={post._id}
              onClick={() => navigate(`/community-hub/${post._id}`)}
              sx={{ py: 1.2, cursor: 'pointer', '&:hover .community-sidebar-title': { color: 'primary.main' } }}
            >
              <Typography className="community-sidebar-title" variant="body2" sx={{ fontWeight: 900, lineHeight: 1.35 }}>
                {post.title}
              </Typography>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 0.75 }}>
                <QuestionAnswerOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  {formatCount(post.replyCount ?? post.replies?.length ?? 0)} answers
                </Typography>
              </Stack>
            </Box>
          ))}
          {(widgets?.mostAnsweredPosts ?? []).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No answered discussions yet.
            </Typography>
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Top Contributors">
        <Stack divider={<Divider />} spacing={0}>
          {(widgets?.topContributors ?? []).slice(0, 5).map((item) => (
            <Stack key={item.user._id} direction="row" spacing={1.25} sx={{ alignItems: 'center', py: 1 }}>
              <Avatar src={item.user.avatar} sx={{ width: 38, height: 38 }}>
                {item.user.name[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                  {item.user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCount(item.answerCount)} answers
                </Typography>
              </Box>
            </Stack>
          ))}
          {(widgets?.topContributors ?? []).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Contributors will appear here after answers are posted.
            </Typography>
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Badges">
        <Stack spacing={1}>
          {badges.map((badge) => (
            <Stack key={badge._id} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Avatar src={badge.imageUrl} variant="rounded" sx={{ width: 34, height: 34, bgcolor: 'success.light' }}>
                <EmojiEventsOutlinedIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                  {badge.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCount(badge.requiredPoints)} pts
                </Typography>
              </Box>
            </Stack>
          ))}
          {badges.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No badges configured yet.
            </Typography>
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Online Members">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 1 }}>
          {(widgets?.onlineMembers ?? []).slice(0, 5).map((item) => (
            <Tooltip
              key={item.user._id}
              arrow
              placement="top"
              title={
                <Stack spacing={1} sx={{ p: 0.5, minWidth: 220 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Avatar src={item.user.avatar} sx={{ width: 36, height: 36 }}>
                      {item.user.name[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        {item.user.name}
                      </Typography>
                      <Typography variant="caption">{item.user.role}</Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={0.4}>
                    <Typography variant="caption">{formatCount(item.stats.discussionsAsked)} discussions asked</Typography>
                    <Typography variant="caption">{formatCount(item.stats.answersGiven)} answers/replies</Typography>
                  </Stack>
                  {item.badges.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                      {item.badges.slice(0, 3).map((badge) => (
                        <Chip key={badge._id} size="small" label={badge.name} />
                      ))}
                    </Stack>
                  )}
                  <Button size="small" variant="contained" onClick={() => navigate(`/community-hub/users/${item.user._id}`)}>
                    View Profile
                  </Button>
                </Stack>
              }
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                }}
              >
                <Badge
                  overlap="circular"
                  variant="dot"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  sx={{ '& .MuiBadge-badge': { bgcolor: 'success.main', border: '2px solid white', width: 12, height: 12, borderRadius: '50%' } }}
                >
                  <Avatar src={item.user.avatar} sx={{ width: 38, height: 38 }}>
                    {item.user.name[0]?.toUpperCase()}
                  </Avatar>
                </Badge>
              </Paper>
            </Tooltip>
          ))}
        </Box>
        {(widgets?.onlineMembers ?? []).length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No members are online right now.
          </Typography>
        )}
      </SectionCard>
    </Stack>
  );
};

export default CommunityRightSidebar;
