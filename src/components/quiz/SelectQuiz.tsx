import { Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fade, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import { Quiz } from '../../stores/types';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function SelectQuiz({ onSelectQuiz }: { onSelectQuiz: (quiz: Quiz) => void }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [hoveredQuizId, setHoveredQuizId] = useState<string | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/get-quizzes");
        if (!response.ok) throw new Error("Failed to fetch quizzes");
        const data = await response.json();
        setQuizzes(data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  // Filter quizzes based on search
  const filteredQuizzes = quizzes.filter((quiz) => {
    const query = searchQuery.toLowerCase();
    return (
      quiz.quizName.toLowerCase().includes(query) ||
      quiz.quizDescription?.toLowerCase().includes(query) ||
      quiz.createdBy.toLowerCase().includes(query) ||
      quiz.quizQuestions.some(q => 
        q.category?.some(cat => cat.toLowerCase().includes(query))
      )
    );
  });

  const handleOpenModal = () => {
    setModalOpen(true);
    setSearchQuery("");
    setSelectedQuiz(null);
    setPreviewQuiz(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSearchQuery("");
    setSelectedQuiz(null);
    setPreviewQuiz(null);
  };

  const handleSelectQuizCard = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
  };

  const handlePreviewQuiz = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewQuiz(quiz);
  };

  const handleClosePreview = () => {
    setPreviewQuiz(null);
  };

  const handleConfirmSelection = () => {
    if (selectedQuiz) {
      onSelectQuiz(selectedQuiz);
      handleCloseModal();
    }
  };

  const getDifficultyColor = (quiz: Quiz) => {
    const avgDifficulty = quiz.quizQuestions.reduce((sum, q) => sum + q.difficulty, 0) / quiz.quizQuestions.length;
    if (avgDifficulty <= 2) return theme.palette.success.main;
    if (avgDifficulty <= 4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getDifficultyLabel = (quiz: Quiz) => {
    const avgDifficulty = quiz.quizQuestions.reduce((sum, q) => sum + q.difficulty, 0) / quiz.quizQuestions.length;
    if (avgDifficulty <= 2) return "Easy";
    if (avgDifficulty <= 4) return "Medium";
    return "Hard";
  };

  return (
    <Box>
      {/* Compact Selection Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleOpenModal}
        disabled={loading}
        fullWidth
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 'bold',
          borderRadius: 2,
          textTransform: 'none',
          bgcolor: theme.palette.secondary.main,
          color: '#fff',
          '&:hover': {
            bgcolor: theme.palette.secondary.dark,
          },
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Select Quiz'}
      </Button>
      
      {quizzes.length > 0 && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available
        </Typography>
      )}

      {/* Modal Dialog (NOT fullScreen) */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            height: '85vh',
            maxHeight: '85vh',
            borderRadius: 3,
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header with Search */}
          <Box
            sx={{
              flexShrink: 0,
              bgcolor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>
                Select a Quiz
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, creator, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton 
                size="small"
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                }}
              >
                <TuneIcon />
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} found
            </Typography>
          </Box>

          {/* Quiz Grid - Scrollable */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 2,
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} />
              </Box>
            ) : filteredQuizzes.length > 0 ? (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 2
              }}>
                {filteredQuizzes.map((quiz, index) => {
                  const isSelected = selectedQuiz?.quizName === quiz.quizName;
                  const isHovered = hoveredQuizId === quiz.quizName;
                  
                  return (
                    <Card
                      key={index}
                      onClick={() => handleSelectQuizCard(quiz)}
                      onMouseEnter={() => setHoveredQuizId(quiz.quizName)}
                      onMouseLeave={() => setHoveredQuizId(null)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        border: `2px solid ${
                          isSelected 
                            ? theme.palette.primary.main 
                            : 'transparent'
                        }`,
                        transform: isHovered || isSelected ? 'translateY(-4px)' : 'translateY(0)',
                        '&:hover': {
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 16px rgba(0,0,0,0.4)'
                            : '0 8px 16px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 2,
                          }}
                        >
                          <CheckCircleIcon 
                            sx={{ 
                              color: theme.palette.primary.main,
                              fontSize: 28,
                            }} 
                          />
                        </Box>
                      )}

                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            width: '100%',
                            height: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.5,
                            borderRadius: 1,
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.03)',
                          }}
                        >
                          <ImageIcon 
                            sx={{ 
                              fontSize: 48, 
                              color: theme.palette.text.disabled,
                            }} 
                          />
                        </Box>

                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '2.8em',
                          }}
                        >
                          {quiz.quizName}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {quiz.quizDescription || 'No description'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                          <Chip
                            label={`${quiz.quizQuestions.length} Q's`}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={getDifficultyLabel(quiz)}
                            size="small"
                            sx={{
                              bgcolor: getDifficultyColor(quiz),
                              color: '#fff',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>

                        {/* Preview Button */}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={(e) => handlePreviewQuiz(quiz, e)}
                          fullWidth
                          sx={{ 
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                          }}
                        >
                          Preview Questions
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <SearchIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No quizzes found
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* Confirmation Footer */}
        <DialogActions 
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.02)' 
              : 'rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ flex: 1 }}>
            {selectedQuiz && (
              <Typography variant="body2" color="text.secondary">
                Selected: <strong>{selectedQuiz.quizName}</strong>
              </Typography>
            )}
          </Box>
          <Button 
            onClick={handleCloseModal}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            variant="contained"
            color="secondary"
            disabled={!selectedQuiz}
            sx={{
              bgcolor: theme.palette.secondary.main,
              color: '#fff',
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              },
            }}
          >
            Confirm Selection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Preview Dialog */}
      <Dialog
        open={!!previewQuiz}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            maxHeight: '85vh',
            borderRadius: 3,
          }
        }}
      >
        {previewQuiz && (
          <>
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton size="small" onClick={handleClosePreview}>
                  <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {previewQuiz.quizName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Preview questions
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              {/* Quiz Info */}
              <Box sx={{ mb: 3 }}>
                {previewQuiz.quizDescription && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {previewQuiz.quizDescription}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${previewQuiz.quizQuestions.length} Questions`} size="small" />
                  <Chip 
                    label={getDifficultyLabel(previewQuiz)} 
                    size="small"
                    sx={{ 
                      bgcolor: getDifficultyColor(previewQuiz),
                      color: '#fff',
                    }}
                  />
                  <Chip label={`By ${previewQuiz.createdBy}`} size="small" variant="outlined" />
                </Box>
              </Box>

              {/* Questions List */}
              {previewQuiz.quizQuestions.map((question, qIndex) => {
                // Safely get all options (handle both array and undefined cases)
                const correctAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
                const incorrectAnswers = Array.isArray(question.incorrectAnswers) ? question.incorrectAnswers : [];
                const allOptions = [...correctAnswers, ...incorrectAnswers];

                return (
                  <Card 
                    key={qIndex}
                    sx={{ 
                      mb: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        {qIndex + 1}. {question.question}
                      </Typography>

                      {question.hint && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                          💡 Hint: {question.hint}
                        </Typography>
                      )}

                      {question.category && question.category.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          {question.category.map((cat, idx) => (
                            <Chip 
                              key={idx}
                              label={cat} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 0.5, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        Options:
                      </Typography>

                      {/* Show all options if they exist */}
                      {allOptions.length > 0 ? (
                        allOptions.map((option, oIndex) => {
                          const isCorrect = correctAnswers.includes(option);
                          return (
                            <Box
                              key={oIndex}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                mb: 0.5,
                                borderRadius: 1,
                                bgcolor: isCorrect
                                  ? theme.palette.mode === 'dark'
                                    ? 'rgba(76, 175, 80, 0.1)'
                                    : 'rgba(76, 175, 80, 0.05)'
                                  : 'transparent',
                                border: `1px solid ${isCorrect ? theme.palette.success.main : theme.palette.divider}`,
                              }}
                            >
                              {isCorrect ? (
                                <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main, mr: 1 }} />
                              ) : (
                                <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: theme.palette.text.disabled, mr: 1 }} />
                              )}
                              <Typography variant="body2">
                                {option}
                              </Typography>
                            </Box>
                          );
                        })
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No options available
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={`${question.points} points`} size="small" sx={{ fontSize: '0.7rem' }} />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </DialogContent>

            <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
              <Button onClick={handleClosePreview}>
                Back to Selection
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  handleSelectQuizCard(previewQuiz);
                  handleClosePreview();
                }}
                sx={{
                  bgcolor: theme.palette.secondary.main,
                  color: '#fff',
                }}
              >
                Select This Quiz
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}