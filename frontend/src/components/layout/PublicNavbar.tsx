import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  InputAdornment,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../context/useAuth';
import { encodeParam, decodeParam } from '../../utils/urlParams';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Keep the navbar input in sync with the URL ?q= param (e.g. when the user
  // types in the browse-page sidebar, the navbar bar should reflect it too)
  const currentQ = decodeParam(searchParams.get('q') ?? '');
  const [query, setQuery] = useState(currentQ);

  useEffect(() => {
    setQuery(currentQ);
  }, [currentQ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set('q', encodeParam(query.trim()));
      navigate(`/courses?${params.toString()}`);
    } else {
      navigate('/courses');
    }
  };

  const dashboardPath =
    user?.role === 'Student' ? '/student/dashboard'
    : user?.role === 'Teacher' ? '/teacher/courses'
    : '/admin/dashboard';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 68 }}>
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <SchoolIcon sx={{ fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, display: { xs: 'none', sm: 'block' }, letterSpacing: -0.5 }}
          >
            MedhaBee
          </Typography>
        </Box>

        {/* Search */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ flex: 1, maxWidth: 520, mx: 'auto' }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search for anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 5, bgcolor: 'grey.50' },
            }}
          />
        </Box>

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Button
            component={RouterLink}
            to="/courses"
            color="inherit"
            sx={{ display: { xs: 'none', md: 'inline-flex' }, color: 'text.primary', fontWeight: 500 }}
          >
            Browse
          </Button>
          <Button
            component={RouterLink}
            to="/pricing"
            color="inherit"
            sx={{ display: { xs: 'none', md: 'inline-flex' }, color: 'text.primary', fontWeight: 500 }}
          >
            Pricing
          </Button>

          {user ? (
            <>
              <Button
                component={RouterLink}
                to={dashboardPath}
                variant="outlined"
                size="small"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Dashboard
              </Button>
              <Tooltip title={user.name}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, cursor: 'pointer' }}>
                  {user.name[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/auth/login"
                sx={{ fontWeight: 600 }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                component={RouterLink}
                to="/auth/register"
                sx={{ fontWeight: 600 }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
