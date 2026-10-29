import { Fragment, useRef, useState, type FC } from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import type { CommunityReactionType, ICommunityReaction } from '../../types/index';
import { formatCount, reactionOptions } from './communityHelpers';

interface ReactionBarProps {
  reactions: ICommunityReaction[];
  disabled: boolean;
  currentUserId?: string;
  onReact: (type: CommunityReactionType) => void;
  answerCount?: number;
  onAnswerClick?: () => void;
}

const getReactionUserId = (reaction: ICommunityReaction) =>
  typeof reaction.user === 'string' ? reaction.user : reaction.user._id;

const getReactionUserName = (reaction: ICommunityReaction) =>
  typeof reaction.user === 'string' ? 'Community member' : reaction.user.name;

const getReactionUserAvatar = (reaction: ICommunityReaction) =>
  typeof reaction.user === 'string' ? undefined : reaction.user.avatar;

const reactionAnimationByType: Record<CommunityReactionType, string> = {
  Like: 'reactionLikeIdle 1400ms ease-in-out infinite',
  Love: 'reactionLoveIdle 1200ms ease-in-out infinite',
  Wow: 'reactionWowIdle 1300ms ease-in-out infinite',
  Sad: 'reactionSadIdle 1700ms ease-in-out infinite',
  Angry: 'reactionAngryIdle 900ms ease-in-out infinite',
  Helpful: 'reactionHelpfulIdle 1500ms ease-in-out infinite',
};

const ReactionBar: FC<ReactionBarProps> = ({
  reactions,
  disabled,
  currentUserId,
  onReact,
  answerCount,
  onAnswerClick,
}) => {
  const activeReaction = reactions.find((reaction) => getReactionUserId(reaction) === currentUserId)?.type;
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CommunityReactionType | 'All'>('All');
  const closeTimer = useRef<number | null>(null);
  const activeOption = reactionOptions.find((option) => option.type === activeReaction) ?? reactionOptions[0];
  const totalReactions = reactions.length;
  const visibleSummary = reactionOptions
    .map((option) => ({
      ...option,
      count: reactions.filter((reaction) => reaction.type === option.type).length,
    }))
    .filter((option) => option.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  const modalReactions =
    selectedType === 'All' ? reactions : reactions.filter((reaction) => reaction.type === selectedType);

  const openPicker = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (!disabled) setOpen(true);
  };
  const closePicker = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 220);
  };

  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
    <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', minHeight: 36 }}>
    <Box
      onMouseEnter={openPicker}
      onMouseLeave={closePicker}
      onFocus={openPicker}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closePicker();
      }}
      sx={{ position: 'relative', display: 'inline-flex', width: 'fit-content' }}
    >
      <Tooltip title={disabled ? 'Sign in to react' : 'Hover to choose a reaction'}>
        <span>
          <Button
            size="small"
            variant="text"
            disabled={disabled}
            onClick={() => onReact(activeReaction ?? 'Like')}
            sx={{
              minWidth: 0,
              height: 36,
              px: 0,
              gap: 0.75,
              textTransform: 'none',
              fontWeight: 800,
              color: activeReaction ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: activeReaction ? 26 : 'inherit',
                lineHeight: 1,
                animation: activeReaction ? 'selectedReactionBounce 220ms ease both' : 'none',
                '@keyframes selectedReactionBounce': {
                  '0%': { transform: 'scale(0.8)' },
                  '55%': { transform: 'scale(1.18)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              {activeReaction ? activeOption.icon : <ThumbUpOutlinedIcon sx={{ fontSize: 26 }} />}
            </Box>
            <Typography component="span" sx={{ fontWeight: 800, fontSize: 16 }}>
              {formatCount(totalReactions)}
            </Typography>
          </Button>
        </span>
      </Tooltip>

      {open && (
        <Box
          onMouseEnter={openPicker}
          onMouseLeave={closePicker}
          sx={{
            position: 'absolute',
            left: 0,
            bottom: 'calc(100% + 8px)',
            zIndex: 10,
            display: 'flex',
            gap: 0.75,
            p: 0.75,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 5,
            boxShadow: '0 12px 34px rgba(15, 23, 42, 0.18)',
            whiteSpace: 'nowrap',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -10,
              height: 12,
            }}
          />
          {reactionOptions.map(({ type, icon }, index) => {
            return (
              <Tooltip key={type} title={type}>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  onReact(type);
                  setOpen(false);
                }}
                sx={{
                  minWidth: 44,
                  height: 44,
                  px: 0.75,
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 24,
                  transformOrigin: 'bottom center',
                  animation: `reactionFloatIn 360ms cubic-bezier(.2, 1.4, .35, 1) ${index * 36}ms both, ${reactionAnimationByType[type]} ${420 + index * 90}ms`,
                  '@keyframes reactionPop': {
                    from: { opacity: 0, transform: 'translateY(8px) scale(0.7)' },
                    to: { opacity: 1, transform: 'translateY(0) scale(1)' },
                  },
                  '@keyframes reactionFloatIn': {
                    '0%': { opacity: 0, transform: 'translateY(18px) scale(0.2) rotate(-14deg)' },
                    '55%': { opacity: 1, transform: 'translateY(-8px) scale(1.22) rotate(5deg)' },
                    '78%': { transform: 'translateY(2px) scale(0.96) rotate(0deg)' },
                    '100%': { opacity: 1, transform: 'translateY(0) scale(1) rotate(0deg)' },
                  },
                  '@keyframes reactionLikeIdle': {
                    '0%, 100%': { transform: 'translateY(0) scale(1)' },
                    '45%': { transform: 'translateY(-4px) scale(1.08)' },
                  },
                  '@keyframes reactionLoveIdle': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '35%': { transform: 'scale(1.18)' },
                    '65%': { transform: 'scale(0.96)' },
                  },
                  '@keyframes reactionWowIdle': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg) scale(1)' },
                    '28%': { transform: 'translateY(-6px) rotate(-6deg) scale(1.12)' },
                    '58%': { transform: 'translateY(1px) rotate(6deg) scale(0.98)' },
                  },
                  '@keyframes reactionSadIdle': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '45%': { transform: 'translateY(5px) rotate(-4deg)' },
                  },
                  '@keyframes reactionAngryIdle': {
                    '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
                    '25%': { transform: 'translateX(-2px) rotate(-3deg)' },
                    '50%': { transform: 'translateX(2px) rotate(3deg)' },
                    '75%': { transform: 'translateX(-1px) rotate(-2deg)' },
                  },
                  '@keyframes reactionHelpfulIdle': {
                    '0%, 100%': { transform: 'translateY(0) scale(1)', filter: 'drop-shadow(0 0 0 rgba(250,204,21,0))' },
                    '50%': { transform: 'translateY(-2px) scale(1.08)', filter: 'drop-shadow(0 0 8px rgba(250,204,21,.65))' },
                  },
                  transition: 'transform 150ms cubic-bezier(.2, 1.4, .35, 1), filter 150ms ease',
                  '&:hover': {
                    bgcolor: 'transparent',
                    animationPlayState: 'paused',
                    transform: 'translateY(-12px) scale(1.34)',
                    filter: 'drop-shadow(0 10px 10px rgba(15,23,42,.28))',
                  },
                }}
              >
                {icon}
              </Button>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
    {answerCount !== undefined && (
      <Button
        size="small"
        variant="text"
        onClick={onAnswerClick}
        sx={{
          minWidth: 0,
          height: 36,
          px: 0,
          gap: 0.75,
          textTransform: 'none',
          color: 'text.secondary',
          fontWeight: 800,
          '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
        }}
      >
        <Typography component="span" sx={{ fontWeight: 800, fontSize: 16 }}>
          {formatCount(answerCount)} Answers
        </Typography>
      </Button>
    )}
    </Stack>

    {visibleSummary.length > 0 && (
      <Button
        variant="text"
        onClick={() => setModalOpen(true)}
        sx={{ minWidth: 0, p: 0, '&:hover': { bgcolor: 'transparent' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 0.5 }}>
          {visibleSummary.map((option, index) => (
            <Box
              key={option.type}
              sx={{
                width: 28,
                height: 28,
                ml: index === 0 ? 0 : -0.75,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: 'background.paper',
                fontSize: 18,
                animation: 'summaryReactionIn 180ms ease both',
                '@keyframes summaryReactionIn': {
                  from: { opacity: 0, transform: 'translateX(6px) scale(0.75)' },
                  to: { opacity: 1, transform: 'translateX(0) scale(1)' },
                },
                transition: 'transform 130ms ease',
                '&:hover': { transform: 'translateY(-2px) scale(1.12)' },
              }}
            >
              {option.icon}
            </Box>
          ))}
        </Box>
      </Button>
    )}

    <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 7, fontWeight: 900 }}>
        Reactions
        <IconButton
          aria-label="Close reactions"
          onClick={() => setModalOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, overflowX: 'auto' }}>
          <Button
            variant="text"
            onClick={() => setSelectedType('All')}
            sx={{
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 900,
              color: selectedType === 'All' ? 'primary.main' : 'text.primary',
              bgcolor: 'transparent',
              boxShadow: 'none',
              borderBottom: '3px solid',
              borderBottomColor: selectedType === 'All' ? 'primary.main' : 'transparent',
              minHeight: 48,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            All {formatCount(reactions.length)}
          </Button>
          {reactionOptions
            .filter((option) => reactions.some((reaction) => reaction.type === option.type))
            .map((option) => (
              <Button
                key={option.type}
                variant="text"
                onClick={() => setSelectedType(option.type)}
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 900,
                  color: selectedType === option.type ? 'primary.main' : 'text.primary',
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  borderBottom: '3px solid',
                  borderBottomColor: selectedType === option.type ? 'primary.main' : 'transparent',
                  minHeight: 48,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                {option.icon} {formatCount(reactions.filter((reaction) => reaction.type === option.type).length)}
              </Button>
            ))}
        </Stack>
        <Divider />
        <Stack sx={{ maxHeight: 480, overflowY: 'auto' }}>
          {modalReactions.map((reaction, index) => {
            const option = reactionOptions.find((item) => item.type === reaction.type);

            return (
              <Fragment key={`${getReactionUserId(reaction)}-${reaction.type}-${index}`}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: 'center', px: 2, py: 1.5 }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Avatar src={getReactionUserAvatar(reaction)} sx={{ width: 46, height: 46 }}>
                      {getReactionUserName(reaction)[0]?.toUpperCase()}
                    </Avatar>
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -4,
                        bottom: -3,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 16,
                      }}
                    >
                      {option?.icon}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>{getReactionUserName(reaction)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reaction.type}
                    </Typography>
                  </Box>
                </Stack>
                {index < modalReactions.length - 1 && <Divider />}
              </Fragment>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
    </Stack>
  );
};

export default ReactionBar;
