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
  
  // Type-safe extraction of options and answers based on question type
  let options: string[] = [];
  let correctAnswers: string[] = [];
  let matchPairs: Record<string, string> | undefined = undefined;
  let leftItems: string[] = [];
  let rightItems: string[] = [];
  let correctAnswer: string | undefined = undefined;

  switch (question.type.name) {
    case "multiple_choice": {
      const t = question.type;
      options = t.options;
      correctAnswers = t.correctAnswers;
      break;
    }
    case "dropdown": {
      const t = question.type;
      options = t.options;
      correctAnswer = t.correctAnswer;
      break;
    }
    case "true_false": {
      const t = question.type;
      correctAnswer = t.correctAnswer;
      options = ["True", "False"];
      break;
    }
    case "short_answer": {
      const t = question.type;
      correctAnswers = t.correctAnswers;
      break;
    }
    case "fill_in_blank": {
      const t = question.type;
      correctAnswers = t.correctAnswers;
      break;
    }
    case "match_the_phrase": {
      const t = question.type;
      matchPairs = t.correctPairs;
      break;
    }
    case "matching": {
      const t = question.type;
      leftItems = t.leftItems;
      rightItems = t.rightItems;
      break;
    }
    case "ranking":
    case "ordering": {
      const t = question.type as any;
      options = t.items || [];
      break;
    }
    case "image_based": {
      const t = question.type;
      correctAnswers = t.correctAnswers;
      break;
    }
    default:
      break;
  }

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

        {/* Render based on question type */}
        {question.type.name === "match_the_phrase" && matchPairs && Object.keys(matchPairs).length > 0 ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Match the following:
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, ml: 2 }}>
              <Box>
                <Typography variant="subtitle2">Term</Typography>
                {Object.keys(matchPairs).map((term, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                    {idx + 1}. {term}
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2">Definition</Typography>
                {Object.values(matchPairs).map((definition, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                    {String.fromCharCode(65 + idx)}. {definition}
                  </Typography>
                ))}
              </Box>
            </Box>
          </>
        ) : question.type.name === "matching" && leftItems.length > 0 && rightItems.length > 0 ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Match the following pairs:
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, ml: 2 }}>
              <Box>
                <Typography variant="subtitle2">Left</Typography>
                {leftItems.map((item, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                    {idx + 1}. {item}
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2">Right</Typography>
                {rightItems.map((item, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                    {String.fromCharCode(65 + idx)}. {item}
                  </Typography>
                ))}
              </Box>
            </Box>
          </>
        ) : options.length > 0 ? (
          <>
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
                    color: showCorrectAnswers && (
                      (correctAnswers && correctAnswers.includes(option)) ||
                      (correctAnswer && correctAnswer === option)
                    )
                      ? theme.palette.success.main
                      : 'inherit'
                  }}
                >
                  {idx + 1}. {option}
                  {showCorrectAnswers && (
                    (correctAnswers && correctAnswers.includes(option)) ||
                    (correctAnswer && correctAnswer === option)
                  ) && ' ✓'}
                </Typography>
              ))}
            </Box>
          </>
        ) : correctAnswers.length > 0 ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Correct Answers:
            </Typography>
            <Box sx={{ ml: 2 }}>
              {correctAnswers.map((ans, idx) => (
                <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                  {idx + 1}. {ans}
                </Typography>
              ))}
            </Box>
          </>
        ) : correctAnswer ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Correct Answer:
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2">{correctAnswer}</Typography>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No options to display.</Typography>
        )}
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
