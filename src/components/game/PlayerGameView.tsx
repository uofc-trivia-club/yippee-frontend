import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
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
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Leaderboard from "./Leaderboard";
import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { gameActions } from "../../stores/gameSlice";
import { resolveMediaUrl } from "../../util/mediaUrl";

export default function PlayerGameView() {
  const game = useSelector((state: RootState) => state.game);
  const isSlideItem = game.currentItem?.kind === 'slide';
  const currentSlide = game.currentItem?.slide;
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  
  // Memoize ranking order change callback to prevent RankingComponent state reset
  const handleRankingOrderChange = useCallback((ordered: string[]) => {
    setSelectedAnswers(ordered);
  }, []);

  const questionNumber = (game.currentQuestionIndex ?? 0) + 1;
  const getQuestionTypeTitle = (typeName?: string) => {
    switch (typeName) {
      case 'multiple_choice': return 'Multiple-choice question';
      case 'multi_select': return 'Multi-select question';
      case 'dropdown': return 'Dropdown question';
      case 'true_false': return 'True/false question';
      case 'short_answer': return 'Short-answer question';
      case 'fill_in_blank': return 'Fill-in-the-blank question';
      case 'numerical': return 'Numerical question';
      case 'match_the_phrase': return 'Match-the-phrase question';
      case 'matching': return 'Matching question';
      case 'ranking': return 'Ranking question';
      case 'ordering': return 'Ranking question';
      case 'image_based': return 'Image-based question';
      case 'essay': return 'Essay question';
      default: return 'Question';
    }
  };

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
            optionImageUrls={q.optionImageUrls}
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
            optionImageUrls={q.optionImageUrls}
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
            optionImageUrls={q.optionImageUrls}
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
      case 'short_answer': {
        return (
          <ShortAnswerQuestion
            textAnswer={textAnswer}
            onAnswerChange={handleTextChange}
            disabled={isSubmitting}
          />
        );
      }
      case 'fill_in_blank': {
        const blankCount = Math.max(1, q.question.split('____').length - 1);
        return (
          <Stack spacing={1.5}>
            {Array.from({ length: blankCount }).map((_, index) => (
              <TextField
                key={`blank-${index}`}
                label={`Blank ${index + 1}`}
                value={selectedAnswers[index] || ''}
                onChange={(e) => {
                  const next = [...selectedAnswers];
                  next[index] = e.target.value;
                  setSelectedAnswers(next);
                }}
                disabled={isDisabled}
                fullWidth
              />
            ))}
          </Stack>
        );
      }
      case 'numerical': {
        return (
          <ShortAnswerQuestion
            textAnswer={textAnswer}
            onAnswerChange={(value) => {
              setTextAnswer(value);
              setSelectedAnswers(value.trim().length > 0 ? [value] : []);
            }}
            disabled={isSubmitting}
            label="Your Numerical Answer"
            inputType="number"
          />
        );
      }
      case 'match_the_phrase': {
        const phrase = (t as any).phrase || q.question || '';
        const slots = ((t as any).slots || []) as string[];
        const options = ((t as any).options || []) as string[];
        return (
          <MatchPhraseQuestion
            phrase={phrase}
            slots={slots}
            options={options}
            disabled={isDisabled}
            onMatchesChange={(formattedMatches: string[]) => setSelectedAnswers(formattedMatches)}
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
            onOrderChange={handleRankingOrderChange}
          />
        );
      }
      case 'image_based': {
        return (
          <ImageBasedQuestion
            imageUrl={t.imageUrl || q.imageUrl || ''}
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

  const levenshteinDistance = (left: string, right: string): number => {
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;

    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    const current = new Array(right.length + 1).fill(0);

    for (let i = 1; i <= left.length; i += 1) {
      current[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + substitutionCost,
        );
      }

      for (let j = 0; j <= right.length; j += 1) {
        previous[j] = current[j];
      }
    }

    return previous[right.length];
  };

  // Fuzzy match helper: accepts close spellings like "paicific" for "pacific"
  const isFuzzyMatch = (submitted: string, accepted: string, threshold: number = 0.85): boolean => {
    const maxLength = Math.max(submitted.length, accepted.length);
    if (!maxLength) return true;

    const distance = levenshteinDistance(submitted, accepted);
    const similarity = 1 - distance / maxLength;
    return similarity >= threshold;
  };

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
      {
        const accepted = ((question.correctAnswers || (type as any).correctAnswers || []) as string[]).map(normalizeText);
        const submittedNormalized = normalizeText(submitted[0] || '');
        // Check for exact match first, then fuzzy match
        return accepted.some((answer: string) => 
          answer === submittedNormalized || isFuzzyMatch(submittedNormalized, answer)
        );
      }

      case 'fill_in_blank': {
        const blankCount = Math.max(1, question.question.split('____').length - 1);
        const groupedAccepted = (question.correctAnswers || (type as any).correctAnswers || []) as string[];
        const submittedTrimmed = submitted.slice(0, blankCount).map((s) => normalizeText(s || ''));
        if (submittedTrimmed.length < blankCount || submittedTrimmed.some((s) => !s)) return false;

        return submittedTrimmed.every((value, index) => {
          const rawAccepted = groupedAccepted[index] || '';
          const acceptedValues = rawAccepted
            .split('|')
            .map((v) => normalizeText(v))
            .filter(Boolean);
          if (!acceptedValues.length) {
            const fallback = normalizeText(groupedAccepted[index] || '');
            return fallback ? fallback === value || isFuzzyMatch(value, fallback) : false;
          }
          // Check for exact match first, then fuzzy match
          return acceptedValues.some(accepted => 
            accepted === value || isFuzzyMatch(value, accepted)
          );
        });
      }

      case 'numerical': {
        const expected = Number((type as any).correctAnswer);
        const actual = Number(submitted[0]);
        return Number.isFinite(expected) && Number.isFinite(actual) && actual === expected;
      }

      case 'essay':
        return false;

      case 'match_the_phrase':
      {
        const correctMap = (type as any).correctAssign || {};
        const accepted = Object.entries(correctMap).map(([slotId, value]) => `${slotId}:${value}`);
        return compareAsSets(submitted, accepted);
      }

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

  // Get player's current rank and stats
  const getPlayerStats = () => {
    const sortedPlayers = Object.values(game.clientsInLobby)
      .filter((user): user is any => 
        user !== null && 
        typeof user === 'object' && 
        'userRole' in user && 
        user.userRole === 'player'
      )
      .sort((a, b) => b.points - a.points);

    const currentPlayerIndex = sortedPlayers.findIndex(p => p.userName === game.user.userName);
    const currentPlayer = sortedPlayers[currentPlayerIndex];
    const leaderPlayer = sortedPlayers[0];
    const pointsBehind = leaderPlayer && currentPlayer ? leaderPlayer.points - currentPlayer.points : 0;

    return {
      rank: currentPlayerIndex + 1,
      points: currentPlayer?.points || 0,
      pointsBehind,
      leaderName: leaderPlayer?.userName,
      totalPlayers: sortedPlayers.length,
    };
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
          {isSlideItem ? (
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
                    label="Slide"
                    color="primary"
                    variant="outlined"
                    sx={{ width: 'fit-content', fontWeight: 700 }}
                  />
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                    {currentSlide?.title || 'Presentation Slide'}
                  </Typography>
                  {currentSlide?.imageUrl ? (
                    <Box
                      component="img"
                      src={resolveMediaUrl(currentSlide.imageUrl)}
                      alt={currentSlide?.title || 'Slide'}
                      sx={{
                        width: '100%',
                        maxWidth: 860,
                        borderRadius: 3,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                        objectFit: 'contain',
                        mt: 1,
                      }}
                    />
                  ) : null}
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentSlide?.content || 'No slide content provided.'}
                  </Typography>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Wait for the host to continue to the next item.
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          ) : (
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
                <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  {getQuestionTypeTitle(game.currentQuestion?.type?.name)}
                </Typography>
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
                {game.currentQuestion?.imageUrl ? (
                  <Box
                    component="img"
                    src={resolveMediaUrl(game.currentQuestion.imageUrl)}
                    alt="Question"
                    sx={{
                      width: '100%',
                      maxWidth: 860,
                      borderRadius: 3,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                      objectFit: 'contain',
                      mt: 1,
                    }}
                  />
                ) : null}
              </Stack>
            </CardContent>
          </Card>
          )}

          {!isSlideItem && game.user.submittedAnswer ? (
            <Typography variant="h6" color="success.main" gutterBottom>
              Answer Submitted Successfully
            </Typography>
          ) : !isSlideItem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {renderQuestionInput()}
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitAnswers}
                disabled={
                  isSubmitting ||
                  (game.currentQuestion?.type?.name !== 'multi_select' && selectedAnswers.length === 0) ||
                  (game.currentQuestion?.type?.name === 'fill_in_blank' && selectedAnswers.some((answer) => !answer?.trim()))
                }
                sx={{ mt: 2 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Submit Answer'
                )}
              </Button>
            </Box>
          ) : null}
        </>
      ) : !game.finalQuestionLeaderboard ? (
        <>
          {(() => {
            const stats = getPlayerStats();
            const getRankOrdinal = (n: number) => {
              const s = ['th', 'st', 'nd', 'rd'];
              const v = n % 100;
              return n + (s[(v - 20) % 10] || s[v] || s[0]);
            };

            return (
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
                  {isAnswerCorrect() ? '✅ You got it right!' : '❌ Incorrect'}
                </Typography>
                
                {/* Points Display */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Current Points</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {stats.points}
                  </Typography>
                </Box>

                {/* Rank Message */}
                <Box sx={{ mb: 1 }}>
                  {stats.pointsBehind === 0 ? (
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      🏆 You're in {getRankOrdinal(stats.rank)} place!
                    </Typography>
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      You are {stats.pointsBehind} {stats.pointsBehind === 1 ? 'point' : 'points'} behind {stats.leaderName}!
                    </Typography>
                  )}
                </Box>

                <Typography variant="body2" sx={{ opacity: 0.9, mt: 2 }}>
                  {isAnswerCorrect()
                    ? 'Great job! Keep this up.'
                    : 'Review the correct answer on the host screen.'}
                </Typography>

                {game.currentQuestion?.explanation ? (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Explanation
                    </Typography>
                    <Typography variant="body2">{game.currentQuestion.explanation}</Typography>
                  </Box>
                ) : null}
              </Box>
            );
          })()}
        </>
      ) : (
        <Leaderboard />
      )}
    </Box>
  );
}