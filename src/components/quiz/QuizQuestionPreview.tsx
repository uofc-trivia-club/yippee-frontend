import { Box, IconButton, Paper, Typography, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { QuizQuestion } from "../../stores/types";

interface QuizQuestionPreviewProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  showCorrectAnswers?: boolean;
}

export default function QuizQuestionPreview({
  question,
  currentIndex,
  totalQuestions,
  onNext,
  onPrevious,
  showCorrectAnswers = false
}: QuizQuestionPreviewProps) {
  const theme = useTheme();
  
  // Combine and possibly shuffle options
  const options = question.options || 
    [...(question.correctAnswers || []), ...(question.incorrectAnswers || [])];
  
  return (
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
          onClick={onPrevious}
          disabled={currentIndex === 0}
          sx={{ 
            bgcolor: currentIndex > 0 ? 
              (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 
              'transparent' 
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          Question {currentIndex + 1} of {totalQuestions}
        </Typography>
        
        <IconButton 
          onClick={onNext}
          disabled={currentIndex >= totalQuestions - 1}
          sx={{ 
            bgcolor: currentIndex < totalQuestions - 1 ? 
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
          {question.question || "No question available"}
        </Typography>
        
        {question.hint && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
            Hint: {question.hint}
          </Typography>
        )}
        
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Options:
        </Typography>
        
        <Box sx={{ ml: 2 }}>
          {options.map((option, idx) => (
            <Typography 
              key={idx} 
              variant="body2" 
              sx={{ 
                mb: 0.5,
                py: 0.5,
                px: 1,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: showCorrectAnswers && question.correctAnswers?.includes(option) 
                  ? theme.palette.success.main 
                  : 'inherit'
              }}
            >
              {idx + 1}. {option}
              {showCorrectAnswers && question.correctAnswers?.includes(option) && ' ✓'}
            </Typography>
          ))}
        </Box>
      </Box>
      
      {/* Question Metadata */}
      <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {question.points} points • Difficulty: {question.difficulty}/10
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {currentIndex + 1} of {totalQuestions}
        </Typography>
      </Box>
    </Paper>
  );
}
