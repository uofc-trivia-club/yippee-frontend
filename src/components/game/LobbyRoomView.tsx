import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { GameSettings, Quiz, User } from "../../stores/types";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@mui/material";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ImageIcon from "@mui/icons-material/Image";
import LobbyChatPanel from "./LobbyChatPanel";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageGameSettings from "../quiz/ManageGameSettings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PsychologyIcon from "@mui/icons-material/Psychology";
import QuizIcon from "@mui/icons-material/Quiz";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { RootState } from "../../stores/store";
import SelectQuiz from "../quiz/SelectQuiz";
import SettingsIcon from "@mui/icons-material/Settings";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import StarIcon from "@mui/icons-material/Star";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { backendUrl } from "../../util/backendConfig";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";
import styles from "./LobbyRoomView.module.css";
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
  const [chatOpen, setChatOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    questionTime: 30,
    enableMessagesDuringGame: true,
    showLeaderboard: true,
    shuffleQuestions: false,
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [quizCardExpanded, setQuizCardExpanded] = useState(false);
  const [quizCardNeedsExpand, setQuizCardNeedsExpand] = useState(false);
  const quizTitleRef = useRef<HTMLHeadingElement | null>(null);
  const quizDescRef = useRef<HTMLParagraphElement | null>(null);

  const lineClamp = (lines: number) => ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  });

  // Handler for host leaving the lobby (ending the room)
  const handleBackToMainClick = () => {
    setSettingsOpen(false);
    setConfirmLeaveOpen(true);
  };

  const handleConfirmLeave = () => {
    // End the game/room for everyone
    executeWebSocketCommand(
      "endGame",
      { roomCode: game.roomCode, user: userDetails },
      (errorMessage) => setError(errorMessage),
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
    const hash = Array.from(name).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    return playerIcons[hash % playerIcons.length];
  };

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--gradient-primary",
      theme.palette.mode === "dark"
        ? `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`
        : `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
    );
    document.documentElement.style.setProperty(
      "--gradient-secondary",
      theme.palette.mode === "dark"
        ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`
        : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
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

    // execute the "sendLobbyMessage" WebSocket command
    executeWebSocketCommand(
      "sendLobbyMessage",
      { roomCode: game.roomCode, user: user },
      (errorMessage) => setError(errorMessage),
    );

    setChatMessages((previousMessages) =>
      [
        ...previousMessages,
        {
          id: `${user.userRole}-${user.userName}-${lobbyMessage}`,
          userName: user.userName,
          userRole: user.userRole,
          message: lobbyMessage,
        },
      ].slice(-25),
    );

    // reset the message to be blank
    setLobbyMessage("");
  };

  const handleStartGame = () => {
    console.log("Starting the Game");
    dispatch(gameActions.setGameSettings(gameSettings));
    executeWebSocketCommand(
      "startGame",
      {
        roomCode: game.roomCode,
        user: userDetails,
        gameSettings: gameSettings,
      },
      (errorMessage) => setError(errorMessage),
    );
  };

  const handleChangeQuiz = (quiz: Quiz) => {
    executeWebSocketCommand(
      "changeQuiz",
      { roomCode: game.roomCode, user: userDetails, quiz },
      (errorMessage) => setError(errorMessage),
    );
  };

  // Host and player lists
  const host = game.clientsInLobby.find((user) => user.userRole === "host");
  const players = game.clientsInLobby.filter(
    (user) => user.userRole === "player",
  );

  const quizMeta = game.quizMeta;
  const quizImageUrl =
    typeof quizMeta?.imageId === "string"
      ? `${backendUrl}/api/images/${quizMeta.imageId}`
      : null;

  const HostIcon = getPlayerIcon(host?.userName || "host");
  const isHost = userDetails.userRole === "host";

  useEffect(() => {
    setQuizCardExpanded(false);
  }, [quizMeta?.quizName]);

  useEffect(() => {
    if (quizCardExpanded) return;
    const titleEl = quizTitleRef.current;
    const descEl = quizDescRef.current;
    const overflows =
      (titleEl ? titleEl.scrollHeight > titleEl.clientHeight + 1 : false) ||
      (descEl ? descEl.scrollHeight > descEl.clientHeight + 1 : false);
    setQuizCardNeedsExpand(overflows);
  }, [quizMeta?.quizName, quizMeta?.quizDescription, quizCardExpanded]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, position: "relative", minHeight: "100%" }}>
      {/* Top bar */}
      <Box sx={{ maxWidth: 1600, mx: "auto", mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Chip
              icon={<VpnKeyIcon />}
              label={`Room Code: ${game.roomCode}`}
              color="primary"
              variant="outlined"
              sx={{ mb: 1, fontWeight: 700, fontSize: "0.85rem" }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Lobby Room
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Chat with players, swap quizzes, and prepare the game before the
              host starts.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title={chatOpen ? "Hide chat" : "Show chat"}>
              <IconButton
                color={chatOpen ? "primary" : "default"}
                onClick={() => setChatOpen((open) => !open)}
                aria-label="toggle chat"
                sx={{ border: `1px solid ${theme.palette.divider}` }}
              >
                <Badge badgeContent={chatMessages.length} color="primary">
                  <ChatBubbleOutlineIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            {isHost && (
              <Tooltip title="Host settings">
                <IconButton
                  color="secondary"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="host settings"
                  sx={{ border: `1px solid ${theme.palette.divider}` }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Main layout */}
      <Box
        sx={{
          maxWidth: 1600,
          mx: "auto",
          display: "grid",
          gridTemplateColumns:
            isDesktop && chatOpen ? "minmax(0, 1fr) 360px" : "minmax(0, 1fr)",
          gap: 2.5,
          alignItems: "start",
          transition: "grid-template-columns 0.25s ease",
        }}
      >
        {/* Main column */}
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          {/* Quiz details card */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,250,252,0.96))",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ textAlign: "center", mb: 2.5 }}>
                <Typography variant="overline" color="text.secondary">
                  Current Quiz
                </Typography>
                <Typography
                  ref={quizTitleRef}
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mt: 0.25,
                    ...(quizCardExpanded ? {} : lineClamp(2)),
                  }}
                >
                  {quizMeta?.quizName || host?.userName || "Loading..."}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    bgcolor: theme.palette.action.hover,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {quizImageUrl ? (
                    <img
                      src={quizImageUrl}
                      alt={`${quizMeta?.quizName || "Quiz"} thumbnail`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <QuizIcon
                      sx={{
                        fontSize: 48,
                        color: theme.palette.text.disabled,
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    ref={quizDescRef}
                    variant="body2"
                    color="text.secondary"
                    sx={quizCardExpanded ? undefined : lineClamp(3)}
                  >
                    {quizMeta?.quizDescription ||
                      "The selected quiz is shown here while the lobby is active."}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}
                  >
                    <Chip
                      size="small"
                      icon={<HelpOutlineIcon />}
                      label={
                        quizMeta?.questionCount != null
                          ? `${quizMeta.questionCount} questions`
                          : "Quiz selected"
                      }
                      variant="outlined"
                    />
                    {quizMeta?.createdBy && (
                      <Chip
                        size="small"
                        label={`by ${quizMeta.createdBy}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  {quizCardNeedsExpand && (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => setQuizCardExpanded((open) => !open)}
                      sx={{
                        mt: 1,
                        p: 0,
                        textTransform: "none",
                        minWidth: 0,
                        fontWeight: 700,
                      }}
                    >
                      {quizCardExpanded ? "Show less" : "Show more"}
                    </Button>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Host card */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: theme.palette.secondary.main,
                    fontSize: 28,
                  }}
                >
                  <HostIcon fontSize="medium" />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">
                    Host
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, lineHeight: 1.2 }}
                    noWrap
                  >
                    {host?.userName || "Loading..."}
                  </Typography>
                </Box>
                <Chip label="Host" color="secondary" size="small" />
                {host?.userMessage && (
                  <Chip
                    label={host.userMessage}
                    size="small"
                    variant="outlined"
                    sx={{ maxWidth: "100%" }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Players */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Players
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`${players.length} joined`}
              />
            </Stack>

            {players.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    md: "1fr 1fr 1fr",
                  },
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
                        transition:
                          "transform 0.15s ease, box-shadow 0.15s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
                        },
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 40,
                              height: 40,
                            }}
                          >
                            <PlayerIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700 }}
                              noWrap
                            >
                              {player.userName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Player
                            </Typography>
                          </Box>
                        </Stack>
                        {player.userMessage && (
                          <Chip
                            label={player.userMessage}
                            size="small"
                            sx={{ mt: 1.5, maxWidth: "100%" }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body1" color="text.secondary">
                    No players connected yet. Share the room code to invite
                    them.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>

          {!isHost && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              You are a player. Wait for the host to start the game.
            </Alert>
          )}
        </Stack>

        {/* Chat: grid column on desktop, overlay on smaller screens */}
        {isDesktop ? (
          chatOpen && (
            <Box sx={{ minWidth: 0, alignSelf: "stretch" }}>
              <LobbyChatPanel
                chatMessages={chatMessages}
                lobbyMessage={lobbyMessage}
                onLobbyMessageChange={setLobbyMessage}
                onSendMessage={handleSendMessage}
                error={error}
                getPlayerIcon={getPlayerIcon}
                onClose={() => setChatOpen(false)}
              />
            </Box>
          )
        ) : (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 1200,
              width: { xs: "min(100vw - 16px, 360px)", sm: 360 },
              maxWidth: "100%",
              transform: chatOpen
                ? "translateX(0)"
                : "translateX(calc(100% + 24px))",
              transition: "transform 0.25s ease",
              pointerEvents: chatOpen ? "auto" : "none",
              opacity: chatOpen ? 1 : 0,
            }}
          >
            <LobbyChatPanel
              chatMessages={chatMessages}
              lobbyMessage={lobbyMessage}
              onLobbyMessageChange={setLobbyMessage}
              onSendMessage={handleSendMessage}
              error={error}
              getPlayerIcon={getPlayerIcon}
              onClose={() => setChatOpen(false)}
            />
          </Box>
        )}

        {/* Host settings overlay panel */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 1200,
            width: { xs: "min(100vw - 16px, 400px)", sm: 400 },
            maxWidth: "100%",
            transform: settingsOpen
              ? "translateX(0)"
              : "translateX(calc(-100% - 24px))",
            transition: "transform 0.25s ease",
            pointerEvents: settingsOpen ? "auto" : "none",
            opacity: settingsOpen ? 1 : 0,
            overflowY: "auto",
            bgcolor: "background.paper",
            borderRight: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 4px 24px rgba(0, 0, 0, 0.5)"
                : "0px 4px 24px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Box sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Host Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure the game and choose a quiz for the room.
                  </Typography>
                </Box>
                <IconButton
                  aria-label="close host settings"
                  onClick={() => setSettingsOpen(false)}
                  sx={{ border: `1px solid ${theme.palette.divider}` }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>

              <Divider />

              <ManageGameSettings onSettingsChange={setGameSettings} />

              <Box>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Change Quiz
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  Pick a different quiz for this room. The change will apply
                  for everyone in the lobby.
                </Typography>
                <SelectQuiz onSelectQuiz={handleChangeQuiz} compact />
              </Box>

              <Divider />

              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                sx={{
                  fontWeight: "bold",
                  color: "#ffffff",
                  py: 1.25,
                }}
                onClick={handleStartGame}
                className={styles.button}
              >
                Start Game
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<LogoutIcon />}
                onClick={handleBackToMainClick}
              >
                End Room
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Confirm leave dialog */}
      <Dialog
        open={confirmLeaveOpen}
        onClose={handleCancelLeave}
        aria-labelledby="confirm-leave-dialog-title"
      >
        <DialogTitle id="confirm-leave-dialog-title">
          Leave Lobby and End Room?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave and close this room? <br />
            <b>
              All players will be disconnected and the room will be deleted.
            </b>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLeave} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLeave}
            color="secondary"
            variant="contained"
            autoFocus
          >
            Yes, Leave and Close Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
