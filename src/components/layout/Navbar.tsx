import { AppBar, Avatar, Box, Button, Container, IconButton, Menu, Toolbar, Typography } from '@mui/material';
import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Select } from '@mui/material';
import { supabase } from '../../util/supabase';
import type { User } from '@supabase/supabase-js';

const themeOptions = [
  { label: 'Red', value: 'red' },
  { label: 'Pink', value: 'pink' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Dark', value: 'dark' },
];

type ThemeName = 'pink' | 'blue' | 'purple' | 'red' | 'dark';
export default function Navbar({ theme, setTheme }: { theme: ThemeName, setTheme: Dispatch<SetStateAction<ThemeName>> }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigate = (path: string) => {
    handleCloseNavMenu();
    navigate(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const getNavbarBackground = () => {
    if (theme === 'dark') return '#1a1a2e';
    if (theme === 'blue') return '#0d47a1';
    if (theme === 'purple') return '#5B0F8B';
    if (theme === 'red') return '#8b0000';
    return '#c2185b';
  };

  if (loading) return null;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: getNavbarBackground(),
        zIndex: 1100,
        boxShadow: `0 2px 20px ${getNavbarBackground()}80`,
        borderRadius: 3,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobile hamburger */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
            <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuItem onClick={() => handleNavigate('/')}>
                <Typography textAlign="center">Home</Typography>
              </MenuItem>
            </Menu>
          </Box>

          {/* Center YIPPEE */}
          <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Box component={Link} to="/" sx={{ textDecoration: 'none' }}>
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontFamily: '"Inter", "Roboto", sans-serif',
                  fontWeight: 800,
                  letterSpacing: '.25rem',
                  color: 'white',
                  textAlign: 'center',
                  fontSize: { xs: '1.4rem', sm: '1.75rem' },
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.85 },
                }}
              >
                YIPPEE
              </Typography>
            </Box>
          </Box>

          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', justifyContent: 'flex-end', gap: 1 }}>
            {user ? (
              <>
                <IconButton onClick={() => navigate('/profile')} sx={{ color: 'white', p: 0.5 }} title="Profile">
                  <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {(user.email ?? '?').charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <IconButton onClick={handleSignOut} sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }} title="Sign out">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              [
                { title: 'Sign Up', path: '/sign-up' },
                { title: 'Sign In', path: '/sign-in' },
              ].map((page) => (
                <Button
                  key={page.path}
                  onClick={() => handleNavigate(page.path)}
                  size="small"
                  sx={{
                    color: 'white',
                    fontWeight: location.pathname === page.path ? 700 : 500,
                    borderBottom: location.pathname === page.path ? '2px solid white' : '2px solid transparent',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s',
                    '&:hover': { background: 'rgba(255,255,255,0.15)' },
                  }}
                >
                  {page.title}
                </Button>
              ))
            )}

            <Select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeName)}
              size="small"
              sx={{
                color: 'white',
                fontSize: '0.8rem',
                borderRadius: 2,
                minWidth: 85,
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                background: 'rgba(255,255,255,0.1)',
                '& .MuiSvgIcon-root': { color: 'white' },
              }}
            >
              {themeOptions.map(opt => (
                <MenuItem value={opt.value} key={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
