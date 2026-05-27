import { useEffect, useState, type FC } from 'react';
import {
  Avatar,
  Box,
  Button,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AppModal from '../../components/common/AppModal';
import ItemActionMenu, { type ItemAction } from '../../components/common/ItemActionMenu';
import RichTextEditor from '../../components/course/RichTextEditor';
import { communityService } from '../../services/community.service';
import type { ICommunityBadge, ICommunityChannel, ICommunityPointRule } from '../../types/index';

type SectionKey = 'channels' | 'badges' | 'points';

interface CommunityAdminModalProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

const emptyChannel = { name: '', description: '', image: null as File | null };
const emptyBadge = { name: '', icon: '', requiredPoints: 0, description: '' };
const toPlainText = (html?: string) => html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() ?? '';

const CommunityAdminModal: FC<CommunityAdminModalProps> = ({ open, onClose, onChanged }) => {
  const [section, setSection] = useState<SectionKey>('channels');
  const [channels, setChannels] = useState<ICommunityChannel[]>([]);
  const [badges, setBadges] = useState<ICommunityBadge[]>([]);
  const [rules, setRules] = useState<ICommunityPointRule[]>([]);
  const [channelFormOpen, setChannelFormOpen] = useState(false);
  const [badgeFormOpen, setBadgeFormOpen] = useState(false);
  const [channelForm, setChannelForm] = useState(emptyChannel);
  const [badgeForm, setBadgeForm] = useState(emptyBadge);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAdminData = async () => {
    const [channelRes, badgeRes, ruleRes] = await Promise.all([
      communityService.getAdminChannels(),
      communityService.getBadges(),
      communityService.getPointRules(),
    ]);
    setChannels(channelRes.data ?? []);
    setBadges(badgeRes.data ?? []);
    setRules(ruleRes.data ?? []);
  };

  useEffect(() => {
    if (open) void loadAdminData();
  }, [open]);

  const saveChannel = async () => {
    if (!channelForm.name.trim()) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('name', channelForm.name);
    formData.append('description', channelForm.description);
    if (channelForm.image) formData.append('image', channelForm.image);
    if (editingChannelId) {
      await communityService.updateChannel(editingChannelId, formData);
    } else {
      await communityService.createChannel(formData);
    }
    setChannelForm(emptyChannel);
    setEditingChannelId(null);
    setChannelFormOpen(false);
    await loadAdminData();
    onChanged();
    setSaving(false);
  };

  const saveBadge = async () => {
    if (!badgeForm.name.trim() || !badgeForm.icon.trim()) return;
    setSaving(true);
    if (editingBadgeId) {
      await communityService.updateBadge(editingBadgeId, badgeForm);
    } else {
      await communityService.createBadge(badgeForm);
    }
    setBadgeForm(emptyBadge);
    setEditingBadgeId(null);
    setBadgeFormOpen(false);
    await loadAdminData();
    onChanged();
    setSaving(false);
  };

  const saveRules = async () => {
    setSaving(true);
    await communityService.updatePointRules(rules.map((rule) => ({ key: rule.key, points: rule.points })));
    await loadAdminData();
    setSaving(false);
  };

  const archiveChannel = async (id: string) => {
    await communityService.archiveChannel(id);
    await loadAdminData();
    onChanged();
  };

  const archiveBadge = async (id: string) => {
    await communityService.archiveBadge(id);
    await loadAdminData();
    onChanged();
  };

  const startChannelEdit = (channel: ICommunityChannel) => {
    setEditingChannelId(channel._id);
    setChannelForm({ name: channel.name, description: channel.description ?? '', image: null });
    setChannelFormOpen(true);
  };

  const startBadgeEdit = (badge: ICommunityBadge) => {
    setEditingBadgeId(badge._id);
    setBadgeForm({
      name: badge.name,
      icon: badge.icon,
      requiredPoints: badge.requiredPoints,
      description: badge.description ?? '',
    });
    setBadgeFormOpen(true);
  };

  const getChannelActions = (channel: ICommunityChannel): ItemAction[] => {
    if (channel.isArchived) return [];

    return [
      {
        label: 'Edit',
        icon: <EditIcon />,
        onClick: () => startChannelEdit(channel),
      },
      {
        label: 'Archive',
        icon: <ArchiveIcon />,
        color: 'error',
        onClick: () => void archiveChannel(channel._id),
      },
    ];
  };

  const getBadgeActions = (badge: ICommunityBadge): ItemAction[] => {
    if (badge.isArchived) return [];

    return [
      {
        label: 'Edit',
        icon: <EditIcon />,
        onClick: () => startBadgeEdit(badge),
      },
      {
        label: 'Archive',
        icon: <ArchiveIcon />,
        color: 'error',
        onClick: () => void archiveBadge(badge._id),
      },
    ];
  };

  return (
    <AppModal open={open} onClose={onClose} title="Community Settings" maxWidth="lg" hideActions contentSx={{ p: 0 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, minHeight: 560 }}>
        <Box sx={{ borderRight: { md: '1px solid' }, borderColor: 'divider', bgcolor: 'grey.50', p: 1.5 }}>
          <List dense>
            {[
              ['channels', 'Channels'],
              ['badges', 'Badges'],
              ['points', 'Points Settings'],
            ].map(([key, label]) => (
              <ListItemButton key={key} selected={section === key} onClick={() => setSection(key as SectionKey)} sx={{ borderRadius: 1 }}>
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ p: 3 }}>
          {section === 'channels' && (
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Channels
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={() => {
                    setEditingChannelId(null);
                    setChannelForm(emptyChannel);
                    setChannelFormOpen((value) => !value);
                  }}
                >
                  Create New Channel
                </Button>
              </Stack>
              <Collapse in={channelFormOpen}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Stack spacing={2}>
                    <TextField label="Channel name" value={channelForm.name} onChange={(event) => setChannelForm({ ...channelForm, name: event.target.value })} />
                    <RichTextEditor
                      value={channelForm.description}
                      onChange={(description) => setChannelForm({ ...channelForm, description })}
                      placeholder="Describe this channel..."
                      minHeight={140}
                    />
                    <Button variant="outlined" component="label">
                      Upload Channel Image
                      <input hidden type="file" accept="image/*" onChange={(event) => setChannelForm({ ...channelForm, image: event.target.files?.[0] ?? null })} />
                    </Button>
                    <Button startIcon={<SaveIcon />} variant="contained" disabled={saving || !channelForm.name.trim()} onClick={() => void saveChannel()}>
                      {editingChannelId ? 'Save Channel Changes' : 'Save Channel'}
                    </Button>
                  </Stack>
                </Paper>
              </Collapse>
              <Stack spacing={1}>
                {channels.map((channel) => (
                  <Paper key={channel._id} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, opacity: channel.isArchived ? 0.55 : 1 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar src={channel.imageUrl} variant="rounded">{channel.name[0]}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 900 }}>{channel.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{channel.isArchived ? 'Archived' : toPlainText(channel.description)}</Typography>
                      </Box>
                      <ItemActionMenu actions={getChannelActions(channel)} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}

          {section === 'badges' && (
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Badges
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={() => {
                    setEditingBadgeId(null);
                    setBadgeForm(emptyBadge);
                    setBadgeFormOpen((value) => !value);
                  }}
                >
                  Create New Badge
                </Button>
              </Stack>
              <Collapse in={badgeFormOpen}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Stack spacing={2}>
                    <TextField label="Badge name" value={badgeForm.name} onChange={(event) => setBadgeForm({ ...badgeForm, name: event.target.value })} />
                    <TextField label="Badge icon" value={badgeForm.icon} onChange={(event) => setBadgeForm({ ...badgeForm, icon: event.target.value })} />
                    <TextField
                      label="Required points"
                      type="number"
                      value={badgeForm.requiredPoints}
                      onChange={(event) => setBadgeForm({ ...badgeForm, requiredPoints: Number(event.target.value) })}
                    />
                    <RichTextEditor
                      value={badgeForm.description}
                      onChange={(description) => setBadgeForm({ ...badgeForm, description })}
                      placeholder="Optional badge description..."
                      minHeight={120}
                    />
                    <Button startIcon={<SaveIcon />} variant="contained" disabled={saving || !badgeForm.name.trim()} onClick={() => void saveBadge()}>
                      {editingBadgeId ? 'Save Badge Changes' : 'Save Badge'}
                    </Button>
                  </Stack>
                </Paper>
              </Collapse>
              <Stack spacing={1}>
                {badges.map((badge) => (
                  <Paper key={badge._id} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, opacity: badge.isArchived ? 0.55 : 1 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar variant="rounded">{badge.icon}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 900 }}>{badge.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{badge.requiredPoints} points {badge.isArchived ? '• Archived' : ''}</Typography>
                      </Box>
                      <ItemActionMenu actions={getBadgeActions(badge)} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}

          {section === 'points' && (
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Points Settings
              </Typography>
              <Divider />
              {rules.map((rule, index) => (
                <TextField
                  key={rule.key}
                  label={rule.label}
                  type="number"
                  value={rule.points}
                  onChange={(event) => {
                    const next = [...rules];
                    next[index] = { ...rule, points: Number(event.target.value) };
                    setRules(next);
                  }}
                />
              ))}
              <Button startIcon={<SaveIcon />} variant="contained" disabled={saving} onClick={() => void saveRules()} sx={{ alignSelf: 'flex-start' }}>
                Save Point Settings
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </AppModal>
  );
};

export default CommunityAdminModal;
