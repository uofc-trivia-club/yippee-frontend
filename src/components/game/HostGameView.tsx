import { Box, Button, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import Leaderboard from "./Leaderboard";
import QuestionView from "./QuestionView";
import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { useSelector } from "react-redux";

export default function HostGameView() {
  const game = useSelector((state: RootState) => state.game);
  const [leaderboardView, setLeaderboardView] = useState<'page1' | 'page2'>('page1');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const autoTriggeredRef = useRef(false);
  const timerInitializingRef = useRef(false);

  const handleViewLeaderboard = useCallback(() => {
    console.log("Viewing the leaderboard");
    executeWebSocketCommand(
      "showLeaderboard",
      { roomCode: game.roomCode, user: game.user },
      (errorMessage) => console.log(errorMessage)
    );
    setLeaderboardView('page1');
  }, [game.roomCode, game.user]);

  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    autoTriggeredRef.current = false;
    timerInitializingRef.current = true;
    setHintRevealed(false);
    setTimeRemaining(game.gameSettings?.questionTime || null);

    // Cleanup when question changes or component unmounts
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [game.currentQuestion, game.gameSettings?.questionTime]);

  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    const shouldRunTimer = Boolean(
      game.gameSettings?.questionTime &&
      game.gameSettings.questionTime > 0 &&
      !game.showLeaderboard &&
      game.currentQuestion &&
      timeRemaining !== null &&
      timeRemaining > 0
    );

    if (!shouldRunTimer) return;

    timerInitializingRef.current = false;
    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [game.currentQuestion, game.gameSettings?.questionTime, game.showLeaderboard, timeRemaining]);

  useEffect(() => {
    if (timerInitializingRef.current) return;

    if (!game.showLeaderboard && timeRemaining === 0 && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleViewLeaderboard();
    }
  }, [game.showLeaderboard, handleViewLeaderboard, timeRemaining]);

  const adjustTime = (deltaSeconds: number) => {
    if (game.showLeaderboard || !game.currentQuestion || !game.gameSettings?.questionTime) return;
    setTimeRemaining((prev) => {
      if (prev === null) return null;
      return Math.max(0, prev + deltaSeconds);
    });
  };

  const handleViewLeaderboard2 = () => {
    setLeaderboardView('page2');
  };

  const handleNextQuestion = () => {
    console.log("Moving onto the next question");
    if (game.finalQuestionLeaderboard) {
      executeWebSocketCommand(
        "endGame",
        { roomCode: game.roomCode, user: game.user },
        (errorMessage) => console.log(errorMessage)
      );
    } else {
      executeWebSocketCommand(
        "nextQuestion",
        { roomCode: game.roomCode, user: game.user },
        (errorMessage) => console.log(errorMessage)
      );
    }
  };

  return (
    <>
      <Typography variant="body1">
        You are the host and the game has started
      </Typography>


      {!game.showLeaderboard ? (
        <>
          <QuestionView displayCorrectAnswers={false} />

          {game.currentQuestion?.hint && (
            <Box
              sx={{
                mt: 1,
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'warning.light',
                color: 'warning.contrastText',
              }}
            >
              {hintRevealed ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Hint: {game.currentQuestion.hint}
                </Typography>
              ) : (
                <Button
                  variant="text"
                  onClick={() => setHintRevealed(true)}
                  sx={{ fontWeight: 700, p: 0, minWidth: 'auto', color: 'inherit' }}
                >
                  Reveal Hint
                </Button>
              )}
            </Box>
          )}

          {game.gameSettings?.questionTime && game.gameSettings.questionTime > 0 && (
            <Box sx={{ my: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  color: timeRemaining !== null && timeRemaining <= 10 ? 'error.main' : 'text.primary',
                  animation: timeRemaining !== null && timeRemaining <= 10 ? 'pulse 1s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                  textAlign: 'center',
                }}
              >
                Time Remaining: {timeRemaining ?? game.gameSettings.questionTime} seconds
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                <Button variant="outlined" onClick={() => adjustTime(-5)} disabled={timeRemaining === null || timeRemaining <= 0}>
                  -5s
                </Button>
                <Button variant="outlined" onClick={() => adjustTime(5)} disabled={timeRemaining === null}>
                  +5s
                </Button>
                <Button variant="outlined" onClick={() => adjustTime(-10)} disabled={timeRemaining === null || timeRemaining <= 0}>
                  -10s
                </Button>
                <Button variant="outlined" onClick={() => adjustTime(10)} disabled={timeRemaining === null}>
                  +10s
                </Button>
              </Box>
            </Box>
          )}
          <Button onClick={handleViewLeaderboard}>
            Next
          </Button>
        </>
      ) : (
        // show leaderboard
        <> 
          {leaderboardView === 'page1' ? (
            <>
              <QuestionView displayCorrectAnswers={true} />
              <Button onClick={handleViewLeaderboard2}>
                View Final Results
              </Button>
            </>
          ) : (
            <>
              <Leaderboard />
              <Button onClick={handleNextQuestion}>
                Next Question
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
}