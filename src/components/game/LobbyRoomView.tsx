import { Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, InputAdornment, List, ListItem, Stack, TextField, Typography, useTheme } from "@mui/material";
import { GameSettings, Quiz, User } from "../../stores/types";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ManageGameSettings from "../quiz/ManageGameSettings";
import PsychologyIcon from '@mui/icons-material/Psychology';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { RootState } from "../../stores/store";
import SelectQuiz from "../quiz/SelectQuiz";
import SendIcon from '@mui/icons-material/Send';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import StarIcon from '@mui/icons-material/Star';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";
import styles from './LobbyRoomView.module.css';
import { useNavigate } from "react-router-dom";

type ChatMessage = {
  id: string;
  userName: string;
  userRole: string;
  message: string;
};

export default function LobbyRoomView() {
  const theme = useTheme();
  const game = useSelector((state: RootState) => state.game); // get the clientsInLobby from Redux
  const [lobbyMessage, setLobbyMessage] = useState("");
  const userDetails = useSelector((state: RootState) => state.game.user); // get current user details from Redux
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    questionTime: 30,
    enableMessagesDuringGame: true,
    showLeaderboard: true,
    shuffleQuestions: false,
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  // Handler for host leaving the lobby (ending the room)
  const handleBackToMainClick = () => {
    setConfirmLeaveOpen(true);
  };

  const handleConfirmLeave = () => {
    // End the game/room for everyone
    executeWebSocketCommand(
      "endGame",
      { roomCode: game.roomCode, user: userDetails },
      (errorMessage) => setError(errorMessage)
    );
    setConfirmLeaveOpen(false);
    navigate("/");
  };

  const handleCancelLeave = () => {
    setConfirmLeaveOpen(false);
  };


  const playerIcons = [
    SportsEsportsIcon,
    EmojiEventsIcon,
    PsychologyIcon,
    RocketLaunchIcon,
    FavoriteIcon,
    WhatshotIcon,
    StarIcon,
  ];

  // Utility to get a player icon based on the user's name
  const getPlayerIcon = (name: string) => {
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return playerIcons[hash % playerIcons.length];
  };

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

    setChatMessages((previousMessages) => [
      ...previousMessages,
      {
        id: `${user.userRole}-${user.userName}-${lobbyMessage}`,
        userName: user.userName,
        userRole: user.userRole,
        message: lobbyMessage,
      },
    ].slice(-25));

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

  // Host and player lists
  const host = game.clientsInLobby.find((user) => user.userRole === "host");
  const players = game.clientsInLobby.filter((user) => user.userRole === "player");

  // Move Back to Main Page button and dialog to the top
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {userDetails.userRole === "host" && (
        <Box sx={{ maxWidth: 980, mx: "auto", mb: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="secondary"
            sx={{ fontWeight: 600 }}
            onClick={handleBackToMainClick}
          >
            Back to Main Page
          </Button>
          <Dialog
            open={confirmLeaveOpen}
            onClose={handleCancelLeave}
            aria-labelledby="confirm-leave-dialog-title"
          >
            <DialogTitle id="confirm-leave-dialog-title">Leave Lobby and End Room?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to leave and close this room? <br />
                <b>All players will be disconnected and the room will be deleted.</b>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelLeave} color="primary">
                Cancel
              </Button>
              <Button onClick={handleConfirmLeave} color="secondary" variant="contained" autoFocus>
                Yes, Leave and Close Room
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
      <Card
        elevation={0}
        sx={{
          maxWidth: 980,
          mx: "auto",
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,252,0.96))",
          boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack spacing={3}>
            <Box>
              <Chip
                icon={<StarIcon />}
                label={`Room Code: ${game.roomCode}`}
                color="primary"
                variant="outlined"
                sx={{ mb: 2, fontWeight: 700 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Lobby Room
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Chat with players, swap quizzes, and prepare the game before the host starts.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
                gap: 2,
              }}
            >
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Current Quiz
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {game.clientsInLobby.find((user) => user.userRole === "host")?.userName || "Loading..."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {/* TODO: replace this with the actual quiz title from quizMeta */}
                    The selected quiz is shown here while the lobby is active.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Host
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {host?.userName || "Loading..."}
                  </Typography>
                  {host?.userMessage && (
                    <Chip
                      label={host.userMessage}
                      size="small"
                      sx={{ mt: 1, maxWidth: "100%" }}
                    />
                  )}
                </CardContent>
              </Card>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Players
              </Typography>
              {players.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {players.map((player) => {
                    const PlayerIcon = getPlayerIcon(player.userName);
                    return (
                      <Card
                        key={player.userName}
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                          },
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <PlayerIcon fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                                {player.userName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Player
                              </Typography>
                            </Box>
                          </Stack>
                          {player.userMessage && (
                            <Chip
                              label={player.userMessage}
                              size="small"
                              sx={{ mt: 1.5, maxWidth: '100%' }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No players connected yet.
                </Typography>
              )}
            </Box>

            <Divider />

            <Box>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Lobby Chat
                      </Typography>
                      <Chip label={`${chatMessages.length} messages`} size="small" />
                    </Box>

                    <Box
                      sx={{
                        maxHeight: 260,
                        overflowY: 'auto',
                        px: 0.5,
                        py: 0.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.75)',
                      }}
                    >
                      {chatMessages.length > 0 ? (
                        <List disablePadding>
                          {chatMessages.map((message) => {
                            const MessageIcon = getPlayerIcon(message.userName);
                            const isHost = message.userRole === 'host';

                            return (
                              <ListItem key={message.id} disableGutters sx={{ px: 1, py: 0.75 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.25,
                                    width: '100%',
                                  }}
                                >
                                  <Avatar sx={{ bgcolor: isHost ? theme.palette.secondary.main : theme.palette.primary.main, width: 34, height: 34 }}>
                                    <MessageIcon fontSize="small" />
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                                        {message.userName}
                                      </Typography>
                                      <Chip
                                        label={isHost ? 'Host' : 'Player'}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
                                      />
                                    </Stack>
                                    <Box
                                      sx={{
                                        display: 'inline-block',
                                        px: 1.25,
                                        py: 0.75,
                                        borderRadius: 2,
                                        bgcolor: isHost ? 'rgba(255, 64, 129, 0.12)' : 'rgba(33, 150, 243, 0.10)',
                                        border: `1px solid ${isHost ? 'rgba(255, 64, 129, 0.25)' : 'rgba(33, 150, 243, 0.20)'}`,
                                        wordBreak: 'break-word',
                                        maxWidth: '100%',
                                      }}
                                    >
                                      <Typography variant="body2">{message.message}</Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </ListItem>
                            );
                          })}
                        </List>
                      ) : (
                        <Box sx={{ p: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No messages yet. Send the first one.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Lobby Message
              </Typography>
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
                helperText="Press Enter or click the send icon to post your message to the lobby."
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
                <Typography color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
              </Box>
            </Box>

            {userDetails.userRole === "host" ? (
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body1">
                  You are the host. Manage the game and start the quiz.
                </Typography>

                <ManageGameSettings onSettingsChange={setGameSettings} />

                <Box
                  sx={{
                    mt: 1,
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
                    mt: 1,
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
              <Typography variant="body1">
                You are a player. Wait for the host to start the game.
              </Typography>
            ) : (
              <Typography variant="body1">Loading...</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}