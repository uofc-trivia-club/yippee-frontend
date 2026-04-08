import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import ImageIcon from "@mui/icons-material/Image";
import { Quiz } from "../../stores/types";
import QuizQuestionPreview from "./QuizQuestionPreview";
import styles from "./SelectQuiz.module.css";

const MAX_VISIBLE = 5;

const getQuizImageUrl = (imageId: string) =>
  `http://localhost:8080/api/images/${imageId}`;

interface SelectQuizProps {
  onSelectQuiz: (quiz: Quiz) => void;
  compact?: boolean;
}

export default function SelectQuiz({
  onSelectQuiz,
  compact = false,
}: SelectQuizProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionPage, setQuestionPage] = useState(0);
  const [confirmedQuizId, setConfirmedQuizId] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const normaliseObjectId = (val: unknown): string | undefined =>
      typeof val === "string" ? val : undefined;

    const fetchQuizzes = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/get-quizzes");
        if (!response.ok) throw new Error("Failed to fetch quizzes");

        const data = await response.json();
        const normalised: Quiz[] = Array.isArray(data)
          ? data.map((q: any) => ({
              ...q,
              id: normaliseObjectId(q.id),
              imageId: normaliseObjectId(q.imageId),
            }))
          : [];

        setQuizzes(normalised);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const visibleQuizzes = useMemo(() => quizzes.slice(0, MAX_VISIBLE), [quizzes]);
  const moreQuizzes = useMemo(() => quizzes.slice(MAX_VISIBLE), [quizzes]);

  const handleCardClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuestionPage(0);
  };

  const handleConfirmSelection = () => {
    if (!selectedQuiz) return;

    onSelectQuiz(selectedQuiz);
    if (selectedQuiz.id) {
      setConfirmedQuizId(selectedQuiz.id);
    }
    setSelectedQuiz(null);
  };

  const handleNextQuestion = () => {
    if (!selectedQuiz) return;
    setQuestionPage((prev) =>
      Math.min(prev + 1, selectedQuiz.quizQuestions.length - 1)
    );
  };

  const handlePrevQuestion = () => {
    setQuestionPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Box sx={{ p: compact ? 0 : 4 }}>
      {!compact && (
        <Typography variant="h4" gutterBottom>
          Select a Quiz
        </Typography>
      )}

      {loading ? (
        <CircularProgress />
      ) : quizzes.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "stretch",
            width: "100%",
            maxWidth: "100%",
            overflowX: "auto",
            pb: 1,
          }}
        >
          {visibleQuizzes.map((quiz, index) => {
            const isSelected = confirmedQuizId != null && quiz.id === confirmedQuizId;

            return (
              <Box
                key={quiz.id ?? index}
                className={styles.quizCard}
                sx={{
                  width: 160,
                  minWidth: 160,
                  borderWidth: isSelected ? 2 : 1,
                  borderStyle: "solid",
                  borderColor: isSelected
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                  borderRadius: "8px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isSelected
                    ? theme.palette.mode === "dark"
                      ? "rgba(33,150,243,0.12)"
                      : "rgba(33,150,243,0.06)"
                    : theme.palette.background.paper,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${theme.palette.primary.main}33`
                    : "none",
                  p: 1,
                }}
                onClick={() => handleCardClick(quiz)}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 90,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    bgcolor: theme.palette.action.hover,
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  {typeof quiz.imageId === "string" ? (
                    <img
                      src={getQuizImageUrl(quiz.imageId)}
                      alt={`${quiz.quizName} thumbnail`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <ImageIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                  )}
                </Box>
                <Typography variant="subtitle1" noWrap>
                  {quiz.quizName}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" noWrap>
                  {quiz.quizDescription}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                  Created by: {quiz.createdBy}
                </Typography>
                {isSelected && (
                  <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600, color: theme.palette.primary.main }}>
                    Selected
                  </Typography>
                )}
              </Box>
            );
          })}

          {moreQuizzes.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => setDialogOpen(true)}
              sx={{
                width: 100,
                minWidth: 100,
                height: 90,
                fontSize: "0.9rem",
                p: 1,
                alignSelf: "center",
              }}
            >
              More Quizzes
            </Button>
          )}
        </Box>
      ) : (
        <Typography>No quizzes available.</Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select a Quiz</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {moreQuizzes.map((quiz, index) => (
              <Box
                key={quiz.id ?? index}
                className={styles.quizCard}
                sx={{ width: 160, minWidth: 160, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, cursor: "pointer" }}
                onClick={() => {
                  handleCardClick(quiz);
                  setDialogOpen(false);
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 90,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    bgcolor: theme.palette.action.hover,
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  {typeof quiz.imageId === "string" ? (
                    <img
                      src={getQuizImageUrl(quiz.imageId)}
                      alt={`${quiz.quizName} thumbnail`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
                    />
                  ) : (
                    <ImageIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                  )}
                </Box>
                <Typography variant="subtitle1" noWrap>
                  {quiz.quizName}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" noWrap>
                  {quiz.quizDescription}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedQuiz)}
        onClose={() => setSelectedQuiz(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}
      >
        {selectedQuiz && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0 }}>
              {selectedQuiz.quizName}
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                {selectedQuiz.quizDescription}
              </Typography>
              {selectedQuiz.quizQuestions.length > 0 ? (
                <QuizQuestionPreview
                  question={selectedQuiz.quizQuestions[questionPage]}
                  currentIndex={questionPage}
                  totalQuestions={selectedQuiz.quizQuestions.length}
                  onNext={handleNextQuestion}
                  onPrevious={handlePrevQuestion}
                  showCorrectAnswers
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No questions available.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedQuiz(null)} variant="outlined">
                Cancel
              </Button>
              <Button onClick={handleConfirmSelection} variant="contained" color="primary">
                Confirm Selection
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
