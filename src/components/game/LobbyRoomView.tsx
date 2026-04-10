import { Box, Button, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { GameSettings, Quiz, User } from "../../stores/types";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import ManageGameSettings from "../quiz/ManageGameSettings";
import { RootState } from "../../stores/store";
import SelectQuiz from "../quiz/SelectQuiz";
import SendIcon from '@mui/icons-material/Send';
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";
import styles from './LobbyRoomView.module.css';

export default function LobbyRoomView() {
  const theme = useTheme();
  const game = useSelector((state: RootState) => state.game); // get the clientsInLobby from Redux
  const [lobbyMessage, setLobbyMessage] = useState("");
  const userDetails = useSelector((state: RootState) => state.game.user); // get current user details from Redux
  const [error, setError] = useState<string | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    questionTime: 30,
    enableMessagesDuringGame: true,
    showLeaderboard: true,
    shuffleQuestions: false,
  });
  const dispatch = useDispatch();

  // Set CSS variables for the module styles with improved dark mode
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--gradient-primary',
      theme.palette.mode === 'dark'
        ? `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`
        : `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`
    );
    document.documentElement.style.setProperty(
      '--gradient-secondary',
      theme.palette.mode === 'dark'
        ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`
        : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`
    );
  }, [theme]);

  const handleSendMessage = () => {
    // send a message to be displayed to the lobby
    if (!lobbyMessage.trim()) {
      console.log("can not be set empty");
      return;
    }

    // update the user details with the message sent
    const user = {
      userName: userDetails.userName,
      userRole: userDetails.userRole,
      userMessage: lobbyMessage,
      points: 0,
    } as User;

    // execute the "createLobby" WebSocket command
    executeWebSocketCommand(
      "sendLobbyMessage",
      { roomCode: game.roomCode, user: user },
      (errorMessage) => setError(errorMessage)
    );
    // reset the message to be blank
    setLobbyMessage("");
  };

  const handleStartGame = () => {
    // TODO: ensure that there is at least one player
    console.log("Starting the Game");
    dispatch(gameActions.setGameSettings(gameSettings));
    executeWebSocketCommand(
      "startGame",
      { roomCode: game.roomCode, user: userDetails, gameSettings: gameSettings },
      (errorMessage) => setError(errorMessage)
    );
  };

  const handleChangeQuiz = (quiz: Quiz) => {
    executeWebSocketCommand(
      "changeQuiz",
      { roomCode: game.roomCode, user: userDetails, quiz },
      (errorMessage) => setError(errorMessage)
    );
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Room: {game.roomCode}
      </Typography>
      {/* quiz displayed for players to see */}
      {/* TODO: set it properly to the quiz instead of the host name! */}
      <Typography variant="h5" gutterBottom>
        Quiz: {game.clientsInLobby.find((user) => user.userRole === "host")?.userName || "Loading..."}
      </Typography>
      {/* host displayed */}
      <Typography variant="h5" gutterBottom>
        Host: {game.clientsInLobby.find((user) => user.userRole === "host")?.userName || "Loading..."}
        {game.clientsInLobby.find((user) => user.userRole === "host")?.userMessage &&
          `: ${game.clientsInLobby.find((user) => user.userRole === "host")?.userMessage}`}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Players:
      </Typography>
      <Box>
        {game.clientsInLobby.length > 0 ? (
          game.clientsInLobby
            .filter((user) => user.userRole === "player") // filter only players
            .map((player, index) => (
              <Typography key={index} variant="body1">
                {player.userName}
                {player.userMessage && `: ${player.userMessage}`}
              </Typography>
            ))
        ) : (
          <Typography variant="body1">No players connected yet.</Typography>
        )}
      </Box>
      {/* TODO: add restrictions on the messages you can send*/}

      <TextField
        id="message"
        label="Type Message"
        variant="outlined"
        fullWidth
        value={lobbyMessage}
        onChange={(e) => setLobbyMessage(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSendMessage();
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="send message"
                onClick={handleSendMessage}
                edge="end"
                disabled={!lobbyMessage.trim()}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Typography color="error" sx={{ marginBottom: 2 }}>
          {error}
        </Typography>
      )}
      {userDetails.userRole === "host" ? (
        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body1">
            You are the host. Manage the game and start the quiz.
          </Typography>

          <ManageGameSettings onSettingsChange={setGameSettings} />

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,0,0,0.02)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Change Quiz
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Pick a different quiz for this room. The change will apply for
              everyone in the lobby.
            </Typography>
            <SelectQuiz onSelectQuiz={handleChangeQuiz} compact />
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={{
              marginTop: 2,
              fontWeight: "bold",
              color: "#ffffff",
            }}
            onClick={handleStartGame}
            className={styles.button}
          >
            Start Game
          </Button>
        </Box>
      ) : userDetails.userRole === "player" ? (
        <>
          <Box>
            <Typography variant="body1">
              You are a player. Wait for the host to start the game.
            </Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body1">Loading...</Typography>
      )}
    </Box>
  );
}