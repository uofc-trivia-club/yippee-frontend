import { Box, Typography, useTheme, Button } from "@mui/material";
import { HostGameView, LobbyRoomView, PlayerGameView } from "../components/game";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { gameActions } from "../stores/gameSlice";

import { RootState } from "../stores/store";
import styles from './Game.module.css';
import { useSelector } from "react-redux";

// Remove QuestionView and LobbyRoomView from quiz import since they're now in game folder





export default function LobbyRoom() {
  const userDetails = useSelector((state: RootState) => state.game.user); // get current user details from Redux
  const lobbyStatus = useSelector((state: RootState) => state.game.gameStatus);
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleBackToHome = () => {
    // Clear game state before navigating back to home
    dispatch(gameActions.setRoomCode(""));
    dispatch(gameActions.setGameStatus(""));
    navigate("/", { replace: true });
  };

  return (
    <div className={styles.container}>
      <Box 
        className={styles.innerBox}
        sx={{
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 4px 20px rgba(0, 0, 0, 0.5)'
            : '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        {lobbyStatus === "Waiting" ? (
          <LobbyRoomView />
        ) : lobbyStatus === "In-Progress" ? (
          userDetails.userRole === "host" ? (
            <HostGameView />
          ) : (
            <PlayerGameView />
          )
        ) : lobbyStatus === "Completed" ? (
          <Box>
            {/* TODO: implement a final leaderboard */}
            {/* <FinalLeaderBoard /> */}
            <Typography variant="h5" gutterBottom>
              Game has ended.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleBackToHome}
            >
              Back to Home
            </Button>
          </Box>
        ) : (
          // TODO: handle case where there is no lobbyStatus
          <Box>
              <Typography variant="h5" gutterBottom>
                Error.
              </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
}