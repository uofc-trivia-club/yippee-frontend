import { AppBar, Box, Button, Container, IconButton, Menu, Toolbar, Typography } from '@mui/material';
import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { RootState } from '../../stores/store';
import { Select } from '@mui/material';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';

const pages = [
  { title: 'Sign Up', path: '/sign-up' },
  { title: 'Sign In', path: '/sign-in' },
];

const themeOptions = [
  { label: 'Pink', value: 'pink' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Dark', value: 'dark' },
];

type ThemeName = 'pink' | 'blue' | 'purple' | 'dark';
export default function Navbar({ theme, setTheme }: { theme: ThemeName, setTheme: Dispatch<SetStateAction<ThemeName>> }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const game = useSelector((state: RootState) => state.game);
  const muiTheme = useTheme();
  
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

  // Get the navbar background color based on the theme
  const getNavbarBackground = () => {
    if (theme === 'dark') return '#272727';
    if (theme === 'blue') return '#1976d2';
    if (theme === 'purple') return '#7B1FA2';
    return '#FF6B95'; // Default pink
  };

  // navbar not shown when a game starts
  if (game.roomCode && game.gameStatus !== "") {
    return null;
  }

  return (
    <AppBar position="static" sx={{ 
      backgroundColor: getNavbarBackground(), 
      zIndex: 1100 
    }}>
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Toolbar disableGutters>
          {/* Left section with menu on mobile */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '15%', // Fixed width to balance the right section
            justifyContent: 'flex-start'
          }}>
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
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {pages.map((page) => (
                  <MenuItem 
                    key={page.path} 
                    onClick={() => handleNavigate(page.path)}
                    selected={location.pathname === page.path}
                  >
                    <Typography textAlign="center">{page.title}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>

          {/* Center section with logo - positioned absolutely for perfect centering */}
          <Box 
            sx={{ 
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '50%', // Make the container wider
              maxWidth: '220px',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%', // Take full width of container
                textDecoration: 'none'
              }}
            >
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '.2rem',
                  color: 'white',
                  textAlign: 'center',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' }
                }}
              >
                YIPPEE
              </Typography>
            </Box>
          </Box>

          {/* Right section with navigation and theme selector */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            ml: 'auto', // Push to the right
            justifyContent: 'flex-end',
            width: '15%', // Fixed width to balance the left section
          }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page.path}
                  onClick={() => handleNavigate(page.path)}
                  sx={{ 
                    color: 'white', 
                    display: 'block',
                    fontWeight: location.pathname === page.path ? 'bold' : 'normal',
                    borderBottom: location.pathname === page.path ? '2px solid white' : 'none',
                  }}
                >
                  {page.title}
                </Button>
              ))}
            </Box>

            <Select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeName)}
              size="small"
              sx={{ 
                color: 'white', 
                borderColor: 'white', 
                '.MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'white' 
                }, 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: 1, 
                minWidth: 100,
                ml: 2
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