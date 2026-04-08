import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import Leaderboard from "./Leaderboard";
import {
  MultipleChoiceQuestion,
  DropdownQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  MatchPhraseQuestion,
  MatchingQuestion,
  RankingQuestion,
  ImageBasedQuestion,
  EssayQuestion,
} from "./questionTypes";
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

    const isDisabled = isSubmitting || game.user.submittedAnswer;
    const handleTextChange = (value: string) => {
      setTextAnswer(value);
      setSelectedAnswers(value.trim().length > 0 ? [value] : []);
    };

    switch (t.name) {
      case 'multiple_choice': {
        return (
          <MultipleChoiceQuestion
            options={t.options}
            selectedAnswers={selectedAnswers}
            onAnswerSelect={handleAnswerSelect}
            disabled={isSubmitting}
          />
        );
      }
      case 'dropdown': {
        const options = (t.options || q.options || []) as string[];
        return (
          <DropdownQuestion
            options={options}
            selectedAnswers={selectedAnswers}
            onAnswerSelect={(answers) => setSelectedAnswers(answers)}
            disabled={isDisabled}
          />
        );
      }
      case 'true_false': {
        return (
          <TrueFalseQuestion
            selectedAnswers={selectedAnswers}
            onAnswerSelect={handleAnswerSelect}
            disabled={isSubmitting}
          />
        );
      }
      case 'short_answer':
      case 'fill_in_blank': {
        return (
          <ShortAnswerQuestion
            textAnswer={textAnswer}
            onAnswerChange={handleTextChange}
            disabled={isSubmitting}
          />
        );
      }
      case 'match_the_phrase': {
        const pairs = t.correctPairs || {};
        return (
          <MatchPhraseQuestion
            pairs={pairs}
            disabled={isDisabled}
            onMatchesChange={(formattedMatches) =>
              setSelectedAnswers(formattedMatches)
            }
          />
        );
      }
      case 'matching': {
        const left = t.leftItems || [];
        const right = t.rightItems || [];
        return (
          <MatchingQuestion
            leftItems={left}
            rightItems={right}
            disabled={isDisabled}
            onMatchesChange={(formattedMatches) =>
              setSelectedAnswers(formattedMatches)
            }
          />
        );
      }
      case 'ranking':
      case 'ordering': {
        const items = (((t as any).items || []) as string[]);
        return (
          <RankingQuestion
            items={items}
            disabled={isDisabled}
            onOrderChange={(ordered) => setSelectedAnswers(ordered)}
          />
        );
      }
      case 'image_based': {
        return (
          <ImageBasedQuestion
            imageUrl={t.imageUrl}
            textAnswer={textAnswer}
            onAnswerChange={handleTextChange}
            disabled={isSubmitting}
          />
        );
      }
      case 'essay': {
        return (
          <EssayQuestion
            textAnswer={textAnswer}
            onAnswerChange={handleTextChange}
            disabled={isSubmitting}
          />
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