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
  { label: 'UCalgary', value: 'ucalgary' },
  { label: 'Pink', value: 'pink' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Dark', value: 'dark' },
];

type ThemeName = 'pink' | 'blue' | 'purple' | 'ucalgary' | 'dark';
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
    if (theme === 'dark') return '#272727';
    if (theme === 'blue') return '#1976d2';
    if (theme === 'purple') return '#7B1FA2';
    if (theme === 'ucalgary') return '#A00015';
    return '#FF6B95';
  };

  if (loading) return null;

  return (
    <AppBar position="static" sx={{ backgroundColor: getNavbarBackground(), zIndex: 1100 }}>
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content', justifyContent: 'flex-start' }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
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
          </Box>

          <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '50%', maxWidth: '220px', display: 'flex', justifyContent: 'center' }}>
            <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textDecoration: 'none' }}>
              <Typography
                variant="h5"
                noWrap
                sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.2rem', color: 'white', textAlign: 'center', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
              >
                YIPPEE
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', justifyContent: 'flex-end', minWidth: 'fit-content' }}>
            {user ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={() => navigate('/profile')}
                    sx={{ color: 'white', p: 0.5 }}
                    title="Profile"
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', fontWeight: 700 }}>
                      {(user.email ?? '?').charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Box>
                <IconButton onClick={handleSignOut} sx={{ color: 'white', ml: 0.5 }} title="Sign out">
                  <LogoutIcon />
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
                    display: 'block',
                    fontWeight: location.pathname === page.path ? 'bold' : 'normal',
                    borderBottom: location.pathname === page.path ? '2px solid white' : 'none',
                    ml: 0.5,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
              sx={{ color: 'white', borderColor: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, background: 'rgba(255,255,255,0.1)', borderRadius: 1, minWidth: 100, ml: 2 }}
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
