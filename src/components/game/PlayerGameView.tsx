import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import {
  DropdownQuestion,
  EssayQuestion,
  ImageBasedQuestion,
  MatchPhraseQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  RankingQuestion,
  ShortAnswerQuestion,
  TrueFalseQuestion,
} from "./questionTypes";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import Leaderboard from "./Leaderboard";
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
  const questionNumber = (game.currentQuestionIndex ?? 0) + 1;

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

    const typeName = game.currentQuestion?.type?.name;
    if (typeName === 'multiple_choice') {
      setSelectedAnswers([option]);
      return;
    }

    setSelectedAnswers(prev =>
      prev.includes(option)
        ? prev.filter(answer => answer !== option)
        : [...prev, option]
    );
  };

  const handleSubmitAnswers = async () => {
    const currentType = game.currentQuestion?.type?.name;
    const allowsEmptySubmission = currentType === 'multi_select';

    if (!allowsEmptySubmission && selectedAnswers.length === 0) return;

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

      dispatch(gameActions.setLastSubmittedAnswers(selectedAnswers));
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
      case 'multi_select': {
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
      case 'numerical': {
        return (
          <ShortAnswerQuestion
            textAnswer={textAnswer}
            onAnswerChange={handleTextChange}
            disabled={isSubmitting}
            label="Your Numerical Answer"
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

  const normalizeText = (value: string) => value.trim().toLowerCase();

  const sortNormalized = (values: string[]) => [...values].map(normalizeText).sort();

  const compareAsSets = (left: string[], right: string[]) => {
    if (left.length !== right.length) return false;
    const normalizedLeft = sortNormalized(left);
    const normalizedRight = sortNormalized(right);
    return normalizedLeft.every((value, index) => value === normalizedRight[index]);
  };

  const isAnswerCorrect = () => {
    const question = game.currentQuestion;
    const type = question?.type;
    const submitted = game.lastSubmittedAnswers;

    if (!question || !type || submitted.length === 0) return false;

    switch (type.name) {
      case 'multiple_choice':
        return selectedAnswers[0]
          ? normalizeText(selectedAnswers[0]) === normalizeText((type as any).correctAnswer || question.correctAnswers?.[0] || '')
          : false;

      case 'multi_select':
      case 'image_based': {
        const accepted = (question.correctAnswers || (type as any).correctAnswers || []) as string[];
        return compareAsSets(submitted, accepted);
      }

      case 'dropdown':
      case 'true_false':
        return submitted[0]
          ? normalizeText(submitted[0]) === normalizeText((type as any).correctAnswer || question.correctAnswers?.[0] || '')
          : false;

      case 'short_answer':
      case 'fill_in_blank': {
        const accepted = (question.correctAnswers || (type as any).correctAnswers || []).map(normalizeText);
        return accepted.includes(normalizeText(submitted[0] || ''));
      }

      case 'numerical': {
        const expected = Number((type as any).correctAnswer);
        const actual = Number(submitted[0]);
        return Number.isFinite(expected) && Number.isFinite(actual) && actual === expected;
      }

      case 'essay':
        return false;

      case 'match_the_phrase':
      case 'matching': {
        const correct = question.correctAnswers || [];
        return sortNormalized(submitted).join('|') === sortNormalized(correct).join('|');
      }

      case 'ranking':
      case 'ordering': {
        const correctOrder = ((type as any).correctOrder || question.correctAnswers || []) as string[];
        return submitted.length === correctOrder.length && submitted.every((value, index) => normalizeText(value) === normalizeText(correctOrder[index] || ''));
      }

      default:
        return false;
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
          <Card
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,252,0.96))',
              boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={1.5}>
                <Chip
                  label={`Question ${questionNumber}`}
                  color="primary"
                  variant="outlined"
                  sx={{ width: 'fit-content', fontWeight: 700 }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    wordBreak: 'break-word',
                  }}
                >
                  {game.currentQuestion?.question}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

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
                disabled={((game.currentQuestion?.type?.name !== 'multi_select') && selectedAnswers.length === 0) || isSubmitting}
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
      ) : !game.finalQuestionLeaderboard ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: isAnswerCorrect() ? 'success.main' : 'error.main',
            bgcolor: isAnswerCorrect() ? 'success.light' : 'error.light',
            color: isAnswerCorrect() ? 'success.contrastText' : 'error.contrastText',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            {isAnswerCorrect() ? 'You got the answer right' : 'You got the answer incorrect'}
          </Typography>
          <Typography variant="body1">
            {isAnswerCorrect()
              ? 'Nice work. Wait for the next question or the final results.'
              : 'You can review the correct answer on the host screen.'}
          </Typography>
        </Box>
      ) : (
        <Leaderboard />
      )}
    </Box>
  );
}