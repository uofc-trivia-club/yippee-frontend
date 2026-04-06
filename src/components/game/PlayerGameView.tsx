import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import Leaderboard from "./Leaderboard";
import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";
import { useState } from "react";

export default function PlayerGameView() {
  const game = useSelector((state: RootState) => state.game);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
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

  const renderQuestionInput = () => {
    const q = game.currentQuestion;
    const t = q?.type;
    if (!q || !t) return null;
    switch (t.name) {
      case 'multiple_choice': {
        const options = t.options;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {options.map((option) => (
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
        );
      }
      case 'dropdown': {
        const options = t.options;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {options.map((option) => (
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
        );
      }
      case 'true_false': {
        const options = ["True", "False"];
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {options.map((option) => (
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
        );
      }
      case 'short_answer':
      case 'fill_in_blank': {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Your Answer"
              variant="outlined"
              value={textAnswer}
              onChange={(e) => {
                setTextAnswer(e.target.value);
                setSelectedAnswers([e.target.value]);
              }}
              disabled={isSubmitting}
            />
          </Box>
        );
      }
      case 'match_the_phrase': {
        // For match questions, you may want to implement a custom UI for matching pairs
        // For now, just show the pairs as static text
        const pairs = t.correctPairs;
        if (!pairs || Object.keys(pairs).length === 0) return <Typography>No pairs to display.</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="subtitle2">Term</Typography>
              {Object.keys(pairs).map((term, idx) => (
                <Typography key={idx} variant="body2">{idx + 1}. {term}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle2">Definition</Typography>
              {Object.values(pairs).map((def, idx) => (
                <Typography key={idx} variant="body2">{String.fromCharCode(65 + idx)}. {def}</Typography>
              ))}
            </Box>
          </Box>
        );
      }
      case 'matching': {
        const left = t.leftItems;
        const right = t.rightItems;
        if (!left.length || !right.length) return <Typography>No pairs to display.</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="subtitle2">Left</Typography>
              {left.map((item, idx) => (
                <Typography key={idx} variant="body2">{idx + 1}. {item}</Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle2">Right</Typography>
              {right.map((item, idx) => (
                <Typography key={idx} variant="body2">{String.fromCharCode(65 + idx)}. {item}</Typography>
              ))}
            </Box>
          </Box>
        );
      }
      case 'ranking':
      case 'ordering': {
        const items = (t as any).items;
        return (
          <Box>
            <Typography variant="subtitle2">Items to order:</Typography>
            {items.map((item: string, idx: number) => (
              <Typography key={idx} variant="body2">{idx + 1}. {item}</Typography>
            ))}
          </Box>
        );
      }
      case 'image_based': {
        const imgUrl = t.imageUrl;
        return (
          <Box>
            {imgUrl && <img src={imgUrl} alt="Question" style={{ maxWidth: 300, marginBottom: 8 }} />}
          </Box>
        );
      }
      case 'essay': {
        return <Typography fontStyle="italic" color="text.secondary">Essay question. Answers will be reviewed manually.</Typography>;
      }
      default:
        return <Typography>No options to display.</Typography>;
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
              {renderQuestionInput()}
              
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
        <Leaderboard />
      )}
    </Box>
  );
}