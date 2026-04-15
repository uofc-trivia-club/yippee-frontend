import { Box, IconButton, Paper, Typography, useTheme } from "@mui/material";

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MatchPhraseQuestion from "../game/questionTypes/MatchPhraseQuestion";
import { QuizQuestion } from "../../stores/types";
import { resolveMediaUrl } from "../../util/mediaUrl";

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
  const asStringArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  
  // Type-safe extraction of options and answers based on question type
  let options: string[] = [];
  let correctAnswers: string[] = [];
  let leftItems: string[] = [];
  let rightItems: string[] = [];
  let correctAnswer: string | undefined = undefined;

  switch (question.type.name) {
    case "multiple_choice": {
      const t = question.type;
      options = asStringArray((t as any).options ?? question.options);
      correctAnswer = t.correctAnswer;
      break;
    }
    case "multi_select": {
      const t = question.type;
      options = asStringArray((t as any).options ?? question.options);
      correctAnswers = asStringArray((t as any).correctAnswers ?? question.correctAnswers);
      break;
    }
    case "dropdown": {
      const t = question.type;
      options = asStringArray((t as any).options ?? question.options);
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
      correctAnswers = asStringArray((t as any).correctAnswers ?? question.correctAnswers);
      break;
    }
    case "fill_in_blank": {
      const t = question.type;
      correctAnswers = asStringArray((t as any).correctAnswers ?? question.correctAnswers);
      break;
    }
    case "numerical": {
      const t = question.type;
      correctAnswer = String(t.correctAnswer);
      break;
    }
    case "match_the_phrase": {
      const t = question.type;
      options = asStringArray((t as any).options ?? question.options);
      break;
    }
    case "matching": {
      const t = question.type as any;
      const pairs = Array.isArray(t.pairs) ? t.pairs : [];
      if (pairs.length > 0) {
        leftItems = pairs.map((p: any) => String(p?.left ?? p?.leftItem ?? '')).filter(Boolean);
        rightItems = pairs.map((p: any) => String(p?.right ?? p?.rightItem ?? '')).filter(Boolean);
      } else {
        leftItems = asStringArray(t.leftItems);
        rightItems = asStringArray(t.rightItems);
      }
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
      correctAnswers = asStringArray((t as any).correctAnswers ?? question.correctAnswers);
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

        {question.imageUrl && (
          <Box
            component="img"
            src={resolveMediaUrl(question.imageUrl)}
            alt="Question"
            sx={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 8px 18px rgba(0,0,0,0.10)',
              objectFit: 'cover',
              mb: 1.5,
            }}
          />
        )}

        {question.hint && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
            Hint: {question.hint}
          </Typography>
        )}

        {/* Render based on question type */}
        {question.type.name === "match_the_phrase" ? (
          <MatchPhraseQuestion
            phrase={(question.type as any).phrase || question.question}
            slots={((question.type as any).slots || []) as string[]}
            options={((question.type as any).options || []) as string[]}
            disabled={true}
            showCorrectAnswers={showCorrectAnswers}
            correctAssign={(question.type as any).correctAssign || {}}
            onMatchesChange={() => undefined}
          />
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
        ) : (question.type as any).name === "match_the_phrase" ? (
          <MatchPhraseQuestion
            phrase={(question.type as any).phrase || question.question}
            slots={((question.type as any).slots || []) as string[]}
            options={((question.type as any).options || []) as string[]}
            disabled={true}
            showCorrectAnswers={showCorrectAnswers}
            correctAssign={(question.type as any).correctAssign || {}}
            onMatchesChange={() => undefined}
          />
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
                  {question.optionImageUrls?.[idx] ? (
                    <img
                      src={resolveMediaUrl(question.optionImageUrls[idx])}
                      alt={`Option ${idx + 1}`}
                      style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }}
                    />
                  ) : null}
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

        {showCorrectAnswers && question.explanation ? (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.14)' : 'rgba(33,150,243,0.09)',
              border: `1px solid ${theme.palette.info.main}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Explanation
            </Typography>
            <Typography variant="body2">{question.explanation}</Typography>
          </Box>
        ) : null}
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
