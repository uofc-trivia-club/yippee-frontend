import { Box, Button, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import styles from './Home.module.css';
import { useNavigate } from "react-router-dom";
import { gameActions } from "../stores/gameSlice";

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  // Clear game state when home page mounts
  useEffect(() => {
    dispatch(gameActions.setRoomCode(""));
    dispatch(gameActions.setGameStatus(""));
  }, [dispatch]);

  // Create dynamic styles based on theme with improved dark mode visibility
  const buttonStyle = {
    background: theme.palette.mode === 'dark' 
      ? `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`
      : `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
    color: '#ffffff',
    transition: 'transform 0.2s',
    width: '200px',
    padding: '10px 20px',
    fontWeight: 'bold',
    '&:hover': {
      transform: 'scale(1.05)',
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`
        : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
    }
  };

  return (
    <Box className={styles.buttonContainer}>
      <Button sx={buttonStyle} variant="contained" onClick={() => {navigate(`/host`)}}>
        Host Game
      </Button>
      <Button sx={buttonStyle} variant="contained" onClick={() => {navigate(`/join`, { replace: true })}}>
        Join Game
      </Button>
      <Button sx={buttonStyle} variant="contained" onClick={() => {navigate(`/create-quiz`)}}>
        Create Quiz
      </Button>
      <Button sx={buttonStyle} variant="contained" onClick={() => {navigate(`/resources`)}}>
        Resources
      </Button>
    </Box>
  );
}