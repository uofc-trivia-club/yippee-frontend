import { Box, Button, Chip, Paper, Stack, Typography, Avatar } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import Leaderboard from "./Leaderboard";
import QuestionView from "./QuestionView";
import { resolveMediaUrl } from "../../util/mediaUrl";
import { RootState } from "../../stores/store";
import { executeWebSocketCommand } from "../../util/websocketUtil";
import { useSelector } from "react-redux";
import { User } from "../../stores/types";

export default function HostGameView() {
  const game = useSelector((state: RootState) => state.game);
  const isSlideItem = game.currentItem?.kind === 'slide';
  const currentSlide = game.currentItem?.slide;
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
    setTimeRemaining(isSlideItem ? null : game.gameSettings?.questionTime || null);

    // Cleanup when question changes or component unmounts
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [game.currentQuestion, game.gameSettings?.questionTime, isSlideItem]);

  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    const shouldRunTimer = Boolean(
      game.gameSettings?.questionTime &&
      game.gameSettings.questionTime > 0 &&
      !game.showLeaderboard &&
      !isSlideItem &&
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
  }, [game.currentQuestion, game.gameSettings?.questionTime, game.showLeaderboard, timeRemaining, isSlideItem]);

  useEffect(() => {
    if (timerInitializingRef.current) return;

    if (!game.showLeaderboard && timeRemaining === 0 && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleViewLeaderboard();
    }
  }, [game.showLeaderboard, handleViewLeaderboard, timeRemaining]);

  const adjustTime = (deltaSeconds: number) => {
    if (game.showLeaderboard || isSlideItem || !game.currentQuestion || !game.gameSettings?.questionTime) return;
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
      if (isSlideItem) {
      executeWebSocketCommand(
        "nextQuestion",
        { roomCode: game.roomCode, user: game.user },
        (errorMessage) => console.log(errorMessage)
      );
      return;
    }
      const hasKnownQuestionCount = Number.isFinite(game.questionCount) && game.questionCount > 0;
    const isLastQuestion =
      typeof game.currentQuestionIndex === 'number' &&
        (hasKnownQuestionCount
          ? game.currentQuestionIndex === game.questionCount - 1
          : game.finalQuestionLeaderboard);
    if (isLastQuestion) {
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

  const timerSeconds = timeRemaining ?? game.gameSettings?.questionTime ?? 0;
  const isTimerCritical = timerSeconds <= 10;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlayerStatuses = () => {
    return Object.values(game.clientsInLobby)
      .filter((user): user is User => 
        user !== null && 
        typeof user === 'object' && 
        'userRole' in user && 
        user.userRole === 'player'
      )
      .sort((a, b) => a.userName.localeCompare(b.userName));
  };

  const adjustButtonSx = {
    minWidth: 72,
    borderRadius: 2,
    fontWeight: 700,
    letterSpacing: '0.01em',
  } as const;

  const primaryActionSx = {
    mt: 1,
    px: 2.5,
    py: 1,
    borderRadius: 2,
    fontWeight: 800,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
  } as const;

  return (
    <>
      {!game.showLeaderboard ? (
        <>
          {isSlideItem ? (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" color="text.secondary">Presentation Slide</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, mb: 1 }}>
                {currentSlide?.title || 'Slide'}
              </Typography>
              {currentSlide?.imageUrl ? (
                <Box
                  component="img"
                  src={resolveMediaUrl(currentSlide.imageUrl)}
                  alt={currentSlide?.title || 'Slide'}
                  sx={{ width: '100%', maxWidth: 560, borderRadius: 2, border: '1px solid', borderColor: 'divider', my: 1.5 }}
                />
              ) : null}
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {currentSlide?.content || 'No slide content provided.'}
              </Typography>
            </Paper>
          ) : (
            <QuestionView displayCorrectAnswers={false} />
          )}

          {/* Player Status Board - Jackbox Style */}
          <Paper
            elevation={0}
            sx={{
              my: 2,
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(33, 150, 243, 0.03)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Players ({getPlayerStatuses().filter(p => p.submittedAnswer).length}/{getPlayerStatuses().length})
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {getPlayerStatuses().map((player) => (
                <Box
                  key={player.userName}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: player.submittedAnswer ? 'success.main' : 'warning.main',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {getInitials(player.userName)}
                    </Avatar>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -6,
                        right: -6,
                        bgcolor: player.submittedAnswer ? 'success.main' : 'warning.main',
                        borderRadius: '50%',
                        p: 0.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {player.submittedAnswer ? (
                        <CheckCircleIcon sx={{ fontSize: '1.2rem', color: 'white' }} />
                      ) : (
                        <HourglassEmptyIcon sx={{ fontSize: '1.2rem', color: 'white' }} />
                      )}
                    </Box>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      textAlign: 'center',
                      maxWidth: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {player.userName}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {!isSlideItem && game.currentQuestion?.hint && (
            <Box
              sx={{
                mt: 1,
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'warning.light',
                color: 'warning.contrastText',
                border: '1px solid',
                borderColor: 'warning.main',
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
                  sx={{ fontWeight: 800, p: 0, minWidth: 'auto', color: 'inherit', letterSpacing: '0.02em', textTransform: 'uppercase' }}
                >
                  Reveal Hint
                </Button>
              )}
            </Box>
          )}

          {!isSlideItem && game.gameSettings?.questionTime && game.gameSettings.questionTime > 0 && (
            <Paper
              elevation={0}
              sx={{
                my: 2,
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: isTimerCritical ? 'error.main' : 'divider',
                bgcolor: isTimerCritical
                  ? 'rgba(244, 67, 54, 0.08)'
                  : 'rgba(33, 150, 243, 0.05)',
              }}
            >
              <Stack spacing={1.5} alignItems="center">
                <Chip
                  label={isTimerCritical ? 'Hurry up' : 'Question timer'}
                  color={isTimerCritical ? 'error' : 'primary'}
                  size="small"
                  variant="outlined"
                />

                <Typography
                  variant="h4"
                  sx={{
                    color: isTimerCritical ? 'error.main' : 'text.primary',
                    animation: isTimerCritical ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.45 },
                      '100%': { opacity: 1 },
                    },
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                  }}
                >
                  {timerSeconds}s
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: -0.5 }}>
                  Time Remaining
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Button sx={adjustButtonSx} variant="outlined" onClick={() => adjustTime(-10)} disabled={timeRemaining === null || timeRemaining <= 0}>
                  -10s
                </Button>
                <Button sx={adjustButtonSx} variant="outlined" onClick={() => adjustTime(-5)} disabled={timeRemaining === null || timeRemaining <= 0}>
                  -5s
                </Button>
                <Button sx={adjustButtonSx} variant="outlined" onClick={() => adjustTime(5)} disabled={timeRemaining === null}>
                  +5s
                </Button>
                <Button sx={adjustButtonSx} variant="outlined" onClick={() => adjustTime(10)} disabled={timeRemaining === null}>
                  +10s
                </Button>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Button
            variant="contained"
            color="primary"
            sx={primaryActionSx}
            onClick={isSlideItem ? handleNextQuestion : handleViewLeaderboard}
          >
            {isSlideItem ? 'Next Item' : 'Next'}
          </Button>
        </>
      ) : (
        // show leaderboard
        <> 
          {leaderboardView === 'page1' ? (
            <>
              <QuestionView displayCorrectAnswers={true} />
              <Button variant="contained" color="primary" sx={primaryActionSx} onClick={handleViewLeaderboard2}>
                View Leaderboard
              </Button>
            </>
          ) : (
            <>
              <Leaderboard />
              <Button variant="contained" color="primary" sx={primaryActionSx} onClick={handleNextQuestion}>
                Next Question
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
}