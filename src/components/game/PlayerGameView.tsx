import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import {
  CalendarQuestion,
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
import { PlayerSubmissionSummary, getQuestionTypeTitle, isAnswerCorrectFor } from "./player";

export default function PlayerGameView() {
  const game = useSelector((state: RootState) => state.game);
  const isSlideItem = game.currentItem?.kind === 'slide';
  const currentSlide = game.currentItem?.slide;
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointsAtSubmission, setPointsAtSubmission] = useState<number | null>(null);
  const dispatch = useDispatch();
  
  // Memoize ranking order change callback to prevent RankingComponent state reset
  const handleRankingOrderChange = useCallback((ordered: string[]) => {
    setSelectedAnswers(ordered);
  }, []);

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

  useEffect(() => {
    if (!game.showLeaderboard) {
      setPointsAtSubmission(null);
    }
  }, [game.currentQuestionIndex, game.showLeaderboard]);

  const handleAnswerSelect = (option: string) => {
    if (game.user.submittedAnswer) return;

    const typeName = game.currentQuestion?.type?.name;
    if (typeName === 'multiple_choice' || typeName === 'true_false') {
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
    const questionSnapshot = game.currentQuestion;
    const submittedSnapshot = [...selectedAnswers];

    if (!allowsEmptySubmission && submittedSnapshot.length === 0) return;

    if (currentType === 'ranking' || currentType === 'ordering') {
      console.log('[Ranking Submit] Submitted order:', submittedSnapshot);
    }

    setIsSubmitting(true);
    setError(null);
    setPointsAtSubmission(game.user.points ?? 0);

    try {
      dispatch(gameActions.setLastSubmittedQuestion(questionSnapshot));
      await executeWebSocketCommand(
        "submitAnswer",
        {
          roomCode: game.roomCode,
          user: game.user,
          answer: submittedSnapshot
        },
        (errorMessage) => setError(errorMessage)
      );

      dispatch(gameActions.setLastSubmittedAnswers(submittedSnapshot));
      setSelectedAnswers([]);
      dispatch(gameActions.setSubmittedAnswer(true));
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
      setPointsAtSubmission(null);
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
            optionImageUrls={q.optionImageUrls}
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
      case 'calendar': {
        const correctAnswers = ((t as any).correctAnswers || q.correctAnswers || []) as string[];
        return (
          <CalendarQuestion
            question={q.question || ''}
            correctAnswers={correctAnswers}
            disabled={isDisabled}
            onAnswer={(dates) => setSelectedAnswers(dates)}
            showCorrectAnswers={false}
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

    const normalize = (value: string) => (value || '').trim().toLowerCase();
    const currentPlayerName = normalize(game.user.userName);
    const foundIndex = sortedPlayers.findIndex((p) => normalize(p.userName) === currentPlayerName);
    const currentPlayerIndex = foundIndex >= 0
      ? foundIndex
      : (sortedPlayers.length === 1 ? 0 : -1);
    const currentPlayer = currentPlayerIndex >= 0 ? sortedPlayers[currentPlayerIndex] : undefined;
    const leaderPlayer = sortedPlayers[0];
    const currentPoints = currentPlayer?.points ?? game.user.points ?? 0;
    const pointsBehind = leaderPlayer ? Math.max(0, leaderPlayer.points - currentPoints) : 0;

    return {
      rank: currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : null,
      points: currentPoints,
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
          <PlayerSubmissionSummary
            submissionWasCorrect={pointsAtSubmission !== null
              ? getPlayerStats().points > pointsAtSubmission
              : isAnswerCorrectFor(game.lastSubmittedQuestion || game.currentQuestion, game.lastSubmittedAnswers)}
            points={getPlayerStats().points}
            rank={getPlayerStats().rank}
            pointsBehind={getPlayerStats().pointsBehind}
            leaderName={getPlayerStats().leaderName}
            explanation={game.currentQuestion?.explanation}
          />
        </>
      ) : (
        <Leaderboard />
      )}
    </Box>
  );
}