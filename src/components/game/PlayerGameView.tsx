import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import Leaderboard from "./Leaderboard";
import MatchingComponent from "./MatchingComponent";
import RankingComponent from "./RankingComponent";
import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";

export default function PlayerGameView() {
  const game = useSelector((state: RootState) => state.game);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const questionType = game.currentQuestion?.type;
    setSelectedAnswers([]);
    setTextAnswer("");

    if (questionType?.name === 'ranking' || questionType?.name === 'ordering') {
      const items = ((questionType as any).items || []) as string[];
      setSelectedAnswers(items);
      return;
    }
  }, [game.currentQuestion?.question, game.currentQuestion?.type]);

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

    const currentType = game.currentQuestion?.type?.name;
    if (currentType === 'ranking' || currentType === 'ordering') {
      console.log('[Ranking Submit] Submitted order:', selectedAnswers);
    }

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
                const value = e.target.value;
                setTextAnswer(value);
                setSelectedAnswers(value.trim().length > 0 ? [value] : []);
              }}
              disabled={isSubmitting}
            />
          </Box>
        );
      }
      case 'match_the_phrase': {
        const pairs = t.correctPairs || {};
        if (Object.keys(pairs).length === 0) return <Typography>No pairs to display.</Typography>;
        // Use all keys for term column, values for definition column (could be shuffled optionally)
        const leftItems = Object.keys(pairs);
        const rightItems = Object.values(pairs);
        
        return (
          <MatchingComponent
            leftItems={leftItems}
            rightItems={rightItems}
            disabled={isSubmitting || game.user.submittedAnswer}
            onMatchesChange={(matches) => {
              // Set the selected format back for submission e.g., ["Term1:Def1", "Term2:Def2"]
              const formattedMatches = Object.entries(matches).map(([term, def]) => `${term}:${def}`);
              setSelectedAnswers(formattedMatches);
            }}
          />
        );
      }
      case 'matching': {
        const left = t.leftItems || [];
        const right = t.rightItems || [];
        if (!left.length || !right.length) return <Typography>No pairs to display.</Typography>;
        return (
          <MatchingComponent
            leftItems={left}
            rightItems={right}
            disabled={isSubmitting || game.user.submittedAnswer}
            onMatchesChange={(matches) => {
              const formattedMatches = Object.entries(matches).map(([l, r]) => `${l}:${r}`);
              setSelectedAnswers(formattedMatches);
            }}
          />
        );
      }
      case 'ranking':
      case 'ordering': {
        const items = (((t as any).items || []) as string[]);
        return (
          <RankingComponent
            items={items}
            disabled={isSubmitting || game.user.submittedAnswer}
            onOrderChange={(ordered) => setSelectedAnswers(ordered)}
          />
        );
      }
      case 'image_based': {
        const imgUrl = t.imageUrl;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {imgUrl && <img src={imgUrl} alt="Question" style={{ maxWidth: 300, marginBottom: 8 }} />}
            <TextField
              label="Your Answer"
              variant="outlined"
              value={textAnswer}
              onChange={(e) => {
                const value = e.target.value;
                setTextAnswer(value);
                setSelectedAnswers(value.trim().length > 0 ? [value] : []);
              }}
              disabled={isSubmitting}
            />
          </Box>
        );
      }
      case 'essay': {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography fontStyle="italic" color="text.secondary">
              Essay question. Answers will be reviewed manually.
            </Typography>
            <TextField
              label="Your Response"
              variant="outlined"
              multiline
              minRows={4}
              value={textAnswer}
              onChange={(e) => {
                const value = e.target.value;
                setTextAnswer(value);
                setSelectedAnswers(value.trim().length > 0 ? [value] : []);
              }}
              disabled={isSubmitting}
            />
          </Box>
        );
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