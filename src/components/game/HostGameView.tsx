import { Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import Leaderboard from "./Leaderboard";
import QuestionView from "./QuestionView";
import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { useSelector } from "react-redux";

export default function HostGameView() {
  const game = useSelector((state: RootState) => state.game);
  const [leaderboardView, setLeaderboardView] = useState<'page1' | 'page2'>('page1');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Reset time remaining
    setTimeRemaining(game.gameSettings?.questionTime || null);

    // Only start timer if we have valid conditions
    if (game.gameSettings?.questionTime && 
        game.gameSettings.questionTime > 0 && 
        !game.showLeaderboard && 
        game.currentQuestion) {

      // Start countdown interval
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);

      // Set main timer for auto-showing leaderboard
      timerRef.current = setTimeout(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        handleViewLeaderboard();
      }, game.gameSettings.questionTime * 1000);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [game.currentQuestion, game.gameSettings?.questionTime, game.showLeaderboard]);


  const handleViewLeaderboard = () => {
    console.log("Viewing the leaderboard")
    executeWebSocketCommand(
      "showLeaderboard",
      { roomCode: game.roomCode, user: game.user},
      (errorMessage) => console.log(errorMessage)
    );
    setLeaderboardView('page1')
  }

  const handleViewLeaderboard2 = () => {
    setLeaderboardView('page2')
  }

  const handleNextQuestion = () => {
    console.log("Moving onto the next question")
    if(game.finalQuestionLeaderboard) {
      executeWebSocketCommand(
        "endGame",
        { roomCode: game.roomCode, user: game.user},
        (errorMessage) => console.log(errorMessage)
      );
    } else {
      executeWebSocketCommand(
        "nextQuestion",
        { roomCode: game.roomCode, user: game.user},
        (errorMessage) => console.log(errorMessage)
      );
    }
  }

  return (
    <>
      <Typography variant="body1">
        You are the host and the game has started
      </Typography>


      {!game.showLeaderboard ? (
        <>
          <QuestionView displayCorrectAnswers={false} />
          {game.gameSettings?.questionTime && game.gameSettings.questionTime > 0 && (
            <Typography 
              variant="h6" 
              sx={{ 
                color: timeRemaining && timeRemaining <= 10 ? 'error.main' : 'text.primary',
                animation: timeRemaining && timeRemaining <= 10 ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
                marginY: 2,
                textAlign: 'center'
              }}
            >
              Time Remaining: {timeRemaining ?? game.gameSettings.questionTime} seconds
            </Typography>
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