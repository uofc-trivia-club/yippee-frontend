import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";
import { useState } from "react";

export default function PlayerGameView() {
  const game = useSelector((state: RootState) => state.game);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  
  const handleAnswerSelect = (option: string) => {
    if (game.user.submittedAnswer) return;
    
    setSelectedAnswers(prev => 
      prev.includes(option) 
        ? prev.filter(answer => answer !== option)
        : [...prev, option]
    );
  };

  const handleSubmitAnswers = async () => {
    if (selectedAnswers.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      await executeWebSocketCommand(
        "submitAnswer",
        { 
          roomCode: game.roomCode, 
          user: game.user, 
          answer: selectedAnswers
        },
        (errorMessage) => setError(errorMessage)
      );

      setSelectedAnswers([]);
      dispatch(gameActions.setSubmittedAnswer(true));
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!game.showLeaderboard ? (
        <>
          <Typography variant="h5" gutterBottom>
            {game.currentQuestion?.question}
          </Typography>
          
          {game.user.submittedAnswer ? (
            <Typography variant="h6" color="success.main" gutterBottom>
              Answer Submitted Successfully
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.isArray(game.currentQuestion?.options) &&
                  game.currentQuestion?.options.map((option) => (
                    <Button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      variant={selectedAnswers.includes(option) ? "contained" : "outlined"}
                      sx={{ m: 1, minWidth: '120px' }}
                      disabled={isSubmitting}
                    >
                      {option}
                    </Button>
                  ))}
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitAnswers}
                disabled={selectedAnswers.length === 0 || isSubmitting}
                sx={{ mt: 2 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Submit Answer'
                )}
              </Button>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h6">
            Leaderboard
          </Typography>
        </Box>
      )}
    </Box>
  );
}