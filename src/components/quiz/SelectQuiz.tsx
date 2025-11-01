import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Paper, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageIcon from '@mui/icons-material/Image';
import { Quiz } from '../../stores/types';

const MAX_VISIBLE = 5;

export default function SelectQuiz({ onSelectQuiz }: { onSelectQuiz: (quiz: Quiz) => void }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionPage, setQuestionPage] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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

  const visibleQuizzes = quizzes.slice(0, MAX_VISIBLE);
  const moreQuizzes = quizzes.slice(MAX_VISIBLE);

  const handleCardClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setPreviewOpen(true);
    setCurrentQuestionIndex(0); // Reset to first question
  };

  const handleSelectQuiz = () => {
    if (selectedQuiz) {
      onSelectQuiz(selectedQuiz);
      setPreviewOpen(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Select a Quiz
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : quizzes.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', width: '100%', maxWidth: '100%', overflowX: 'auto', pb: 1 }}>
          {visibleQuizzes.map((quiz, index) => (
            <Box
              key={index}
              sx={{
                width: 140,
                minWidth: 140,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "8px",
                textAlign: "center",
                cursor: "pointer",
                background: theme.palette.background.paper,
                '&:hover': { boxShadow: `0 4px 8px ${theme.palette.action.hover}` },
                p: 1
              }}
              onClick={() => handleCardClick(quiz)}
            >
              <Box sx={{ 
                width: '100%', 
                height: 80, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 1, 
                bgcolor: theme.palette.action.hover, 
                borderRadius: 1 
              }}>
                <ImageIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
              </Box>
              <Typography variant="subtitle1" noWrap>{quiz.quizName}</Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {quiz.quizDescription}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Created by: {quiz.createdBy}
              </Typography>
            </Box>
          ))}
          {moreQuizzes.length > 0 && (
            <Button variant="outlined" onClick={() => setDialogOpen(true)} sx={{ width: 80, minWidth: 80, height: 80, fontSize: '0.9rem', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
              More Quizzes
            </Button>
          )}
        </Box>
      ) : (
        <Typography>No quizzes available.</Typography>
      )}
      {/* More Quizzes Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select a Quiz</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
            {moreQuizzes.map((quiz, index) => (
              <Box
                key={index}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "8px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: theme.palette.background.paper,
                  '&:hover': { boxShadow: `0 4px 8px ${theme.palette.action.hover}` },
                  p: 1,
                  width: 140,
                  minWidth: 140,
                  m: 1
                }}
                onClick={() => handleCardClick(quiz)}
              >
                <Box sx={{ 
                  width: '100%', 
                  height: 80, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mb: 1, 
                  bgcolor: theme.palette.action.hover, 
                  borderRadius: 1 
                }}>
                  <ImageIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                </Box>
                <Typography variant="subtitle1" noWrap>{quiz.quizName}</Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {quiz.quizDescription}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  Created by: {quiz.createdBy}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
      {/* Quiz Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0 }}>{selectedQuiz?.quizName}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: theme.palette.action.hover, 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: 2 
            }}>
              <ImageIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
            </Box>
            <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center', color: theme.palette.text.secondary }}>{selectedQuiz?.quizDescription}</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>Questions:</Typography>
          <Box sx={{ 
            bgcolor: theme.palette.action.hover, 
            borderRadius: 2, 
            p: 2, 
            mb: 2, 
            minHeight: 100, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            position: 'relative' 
          }}>
            {selectedQuiz?.quizQuestions && selectedQuiz.quizQuestions.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Button
                    onClick={() => setQuestionPage((prev) => Math.max(prev - 1, 0))}
                    disabled={questionPage === 0}
                    sx={{ minWidth: 0, p: 1 }}
                  >
                    <ArrowBackIosNewIcon fontSize="small" />
                  </Button>
                  <Box sx={{ flex: 1, px: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {questionPage + 1}. {selectedQuiz.quizQuestions[questionPage].question}
                    </Typography>
                    {/* Show answers if available */}
                    {selectedQuiz.quizQuestions[questionPage].correctAnswers && selectedQuiz.quizQuestions[questionPage].incorrectAnswers ? (
                      <Box>
                        {[...(selectedQuiz.quizQuestions[questionPage].correctAnswers || []), ...(selectedQuiz.quizQuestions[questionPage].incorrectAnswers || [])].map((ans, idx) => (
                          <Typography key={idx} variant="body2" sx={{ ml: 2, color: selectedQuiz.quizQuestions[questionPage].correctAnswers.includes(ans) ? 'success.main' : 'text.secondary' }}>
                            - {ans}
                          </Typography>
                        ))}
                      </Box>
                    ) : null}
                  </Box>
                  <Button
                    onClick={() => setQuestionPage((prev) => Math.min(prev + 1, selectedQuiz.quizQuestions.length - 1))}
                    disabled={questionPage === selectedQuiz.quizQuestions.length - 1}
                    sx={{ minWidth: 0, p: 1 }}
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Question {questionPage + 1} of {selectedQuiz.quizQuestions.length}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">No questions available.</Typography>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
          <Button 
            onClick={() => setDetailsOpen(false)} 
            variant="outlined"
            sx={{
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : undefined,
              color: theme.palette.mode === 'dark' ? theme.palette.common.white : undefined,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSelectQuiz} 
            variant="contained" 
            color="primary"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.mode === 'dark' ? theme.palette.common.white : undefined,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            Select This Quiz
          </Button>
        </Box>
      </Dialog>
      
      {/* Quiz Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: { 
            borderRadius: 2,
            minWidth: { xs: '90%', sm: '80%', md: '600px' },
            maxWidth: '800px',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        {selectedQuiz && (
          <>
            <DialogTitle sx={{ 
              pt: 3, 
              pb: 0, 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {selectedQuiz.quizName}
            </DialogTitle>
            
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', 
                mb: 3 
              }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    width: '100%',
                    maxWidth: 120,
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <ImageIcon sx={{ fontSize: 60, color: theme.palette.text.secondary }} />
                </Paper>
                
                <Typography variant="body1" sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
                  {selectedQuiz.quizDescription || "This is a quiz on " + selectedQuiz.quizName.toLowerCase()}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Questions:
              </Typography>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  p: 3,
                  borderRadius: 2,
                  position: 'relative',
                  minHeight: 150,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Question Navigation */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <IconButton 
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    sx={{ 
                      bgcolor: currentQuestionIndex > 0 ? 
                        (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 
                        'transparent' 
                    }}
                  >
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Question {currentQuestionIndex + 1} of {selectedQuiz.quizQuestions.length}
                  </Typography>
                  
                  <IconButton 
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex >= selectedQuiz.quizQuestions.length - 1}
                    sx={{ 
                      bgcolor: currentQuestionIndex < selectedQuiz.quizQuestions.length - 1 ? 
                        (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 
                        'transparent' 
                    }}
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                {/* Question Content */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedQuiz.quizQuestions[currentQuestionIndex]?.question || "No question available"}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Options:
                  </Typography>
                  
                  <Box sx={{ ml: 2 }}>
                    {(selectedQuiz.quizQuestions[currentQuestionIndex]?.options || 
                     [...(selectedQuiz.quizQuestions[currentQuestionIndex]?.correctAnswers || []),
                      ...(selectedQuiz.quizQuestions[currentQuestionIndex]?.incorrectAnswers || [])]
                    ).map((option, idx) => (
                      <Typography 
                        key={idx} 
                        variant="body2" 
                        sx={{ 
                          mb: 0.5,
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        }}
                      >
                        {idx + 1}. {option}
                      </Typography>
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 'auto',
                  pt: 1
                }}>
                  <Typography variant="caption" color="text.secondary">
                    {currentQuestionIndex + 1} of {selectedQuiz.quizQuestions.length}
                  </Typography>
                </Box>
              </Paper>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button 
                onClick={() => setPreviewOpen(false)} 
                variant="outlined" 
                sx={{ px: 3 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSelectQuiz} 
                variant="contained" 
                color="primary" 
                sx={{ px: 3 }}
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