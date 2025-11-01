import { Box, Button, IconButton, TextField, Typography, useTheme } from "@mui/material";
import { executeWebSocketCommand, useCheckConnection } from "../util/websocketUtil";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { Quiz } from "../stores/types";
import { RootState } from "../stores/store";
import { ManageGameSettings, SelectQuiz } from "../components/quiz";
import SettingsIcon from '@mui/icons-material/Settings';
import { gameActions } from "../stores/gameSlice";
import styles from './HostGame.module.css';
import { useNavigate } from "react-router-dom";

export default function HostGame() {
  const [hostName, setHostName] = useState<string>(""); // host name input
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  // get necessary states from Redux
  const roomCode = useSelector((state: RootState) => state.game.roomCode);
  const gameStatus = useSelector((state: RootState) => state.game.gameStatus);

  useCheckConnection();

  useEffect(() => {
    if (roomCode && gameStatus === "Waiting") {
      navigate(`/${roomCode}`);
    }
  }, [roomCode, gameStatus, navigate]);

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleModifyLobbySettings = () => {
    console.log("modify lobby settings pressed")
  }

  const handleHostGame = async () => {
    const errors: string[] = [];
    
    // input host name
    if (!hostName.trim()) {
      errors.push("Host name cannot be empty!");
    }
    
    // select quiz
    if (!selectedQuiz) {
      errors.push("Please select a quiz first!");
    }
    
    // display errors if any
    if (errors.length > 0) {
      setError(errors.join("\n"));
      return;
    }
    // update redux state
    dispatch(gameActions.setUserName(hostName));
    dispatch(gameActions.setRole("host"));

    // TODO: figure out how to use the updated state instead of creating an object to pass 
    const user = {
      userName: hostName,
      userRole: "host",
      userMessage: "",
      points: 0,
    };

    console.log("sending the request of createLobby with: ", selectedQuiz, user)

    executeWebSocketCommand(
      "createLobby",
      { quiz: selectedQuiz, user: user },
      (errorMessage) => setError(errorMessage)
    );
  };

  return (
  <div className={styles.container}>
      <Box 
        className={styles.formBox}
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 4px 20px rgba(0, 0, 0, 0.5)'
            : '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      > 
        <Typography variant="h4" gutterBottom className={styles.title}>
          Host a Game
        </Typography>
        {/* <IconButton 
          onClick={handleModifyLobbySettings}
          edge="end"
        >
          <SettingsIcon />
        </IconButton> */}
        <TextField
          id="host-name"
          label="Enter Your Name"
          variant="outlined"
          fullWidth
          value={hostName}
          onChange={(e) => {
            if (e.target.value.length <= 20) {
              setHostName(e.target.value);
            }
          }}
          slotProps={{ htmlInput: { maxLength: 20 }}}
          helperText={`${hostName.length}/20 characters`}
          sx={{ marginBottom: 2 }}
        />
        <SelectQuiz onSelectQuiz={handleSelectQuiz} />
        {selectedQuiz && (
          <Typography variant="h6" gutterBottom className={styles.selectQuizTitle}>
            Selected Quiz: {selectedQuiz.quizName}
          </Typography>
        )}
        {error && (
          <Typography color="error" sx={{ marginBottom: 2, whiteSpace: 'pre-line' }}>
            {error}
          </Typography>
        )}
        <div className={styles.buttonDiv}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleHostGame}
            sx={{
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`
                : `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
              color: '#ffffff',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`
                  : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                transform: 'scale(1.05)',
              },
            }}
          >
            Host Game
          </Button>
        </div>
      </Box>
    </div>
  );
}