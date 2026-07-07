import { Box, Button, Typography, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import styles from './Home.module.css';
import { useNavigate } from "react-router-dom";
import { gameActions } from "../stores/gameSlice";

const buttons = [
  { label: "Host Game", path: "/host", desc: "Start a quiz game and invite players" },
  { label: "Join Game", path: "/join", desc: "Join a game with a room code" },
  { label: "Create Quiz", path: "/create-quiz", desc: "Build your own custom quiz" },
  { label: "Resources", path: "/resources", desc: "Tips, guides, and study materials" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    dispatch(gameActions.setRoomCode(""));
    dispatch(gameActions.setGameStatus(""));
  }, [dispatch]);

  const isUcalgary = theme.palette.primary.main === '#d6001c';

  return (
    <Box className={styles.buttonContainer}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            letterSpacing: '.3rem',
            background: isUcalgary
              ? 'linear-gradient(135deg, #d6001c, #ffcd00, #ff671f)'
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          }}
        >
          YIPPEE
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            mt: 1,
            fontWeight: 500,
            fontSize: { xs: '1rem', sm: '1.2rem' },
            opacity: 0.8,
          }}
        >
          Create, host, and play live trivia games with friends
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: 420 }}>
        {buttons.map((btn) => (
          <Button
            key={btn.path}
            variant="contained"
            onClick={() => navigate(btn.path)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2.5,
              px: 4,
              borderRadius: 3,
              fontWeight: 800,
              fontSize: '1.25rem',
              textTransform: 'none',
              letterSpacing: '.05rem',
              width: '100%',
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: '#fff',
              boxShadow: theme.palette.mode === 'dark'
                ? `0 4px 20px ${theme.palette.primary.dark}60`
                : `0 4px 20px ${theme.palette.primary.main}40`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: `0 6px 28px ${theme.palette.primary.main}60`,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                  : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
            }}
          >
            <span style={{ lineHeight: 1.4 }}>{btn.label}</span>
            <Typography
              variant="caption"
              sx={{
                mt: 0.3,
                fontWeight: 400,
                opacity: 0.85,
                fontSize: '0.8rem',
                lineHeight: 1.2,
              }}
            >
              {btn.desc}
            </Typography>
          </Button>
        ))}
      </Box>
    </Box>
  );
}
