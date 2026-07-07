import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { gameActions } from "../stores/gameSlice";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useTheme } from "@mui/material";

const buttons = [
  { label: "HOST", path: "/host", desc: "Start a quiz game and invite players" },
  { label: "JOIN", path: "/join", desc: "Join a game with a room code" },
  { label: "CREATE", path: "/create-quiz", desc: "Build your own custom quiz" },
  { label: "LEARN", path: "/resources", desc: "Tips, guides, and study materials" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    dispatch(gameActions.setRoomCode(""));
    dispatch(gameActions.setGameStatus(""));
  }, [dispatch]);

  return (
    <Box sx={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      p: 4,
      boxSizing: 'border-box',
    }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            letterSpacing: '.4rem',
            fontSize: { xs: '3rem', sm: '4.5rem', md: '5.5rem' },
            color: theme.palette.primary.main,
            lineHeight: 1.1,
          }}
        >
          YIPPEE
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mt: 0.5, fontWeight: 500, fontSize: { xs: '1rem', sm: '1.15rem' }, opacity: 0.75 }}
        >
          Create, host, and play live trivia games with friends
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ maxWidth: 640, width: '100%' }}>
        {buttons.map((btn) => (
          <Grid item xs={12} sm={6} key={btn.path}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate(btn.path)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                py: 4,
                px: 3,
                borderRadius: 4,
                fontWeight: 900,
                fontSize: '1.6rem',
                letterSpacing: '.15rem',
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                minHeight: 140,
                boxShadow: `0 6px 24px ${theme.palette.primary.main}60`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.04)',
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: `0 8px 32px ${theme.palette.primary.main}80`,
                },
              }}
            >
              {btn.label}
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '0.8rem',
                  letterSpacing: '.02rem',
                  opacity: 0.85,
                  lineHeight: 1.3,
                  textAlign: 'center',
                }}
              >
                {btn.desc}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
