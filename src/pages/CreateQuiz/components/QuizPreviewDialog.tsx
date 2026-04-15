import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useTheme } from "@mui/material";

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { PresentationSlideForm, QuizQuestionForm } from "../createQuizTypes";
import PresentationSlidesPreview from "./PresentationSlidesPreview";
import QuizQuestionsPreview from "./QuizQuestionsPreview";

interface QuizPreviewDialogProps {
  open: boolean;
  quizName: string;
  quizDescription: string;
  slides: PresentationSlideForm[];
  questions: QuizQuestionForm[];
  onClose: () => void;
  onSubmit: () => void;
  getDifficultyLabel: (difficulty: number) => string;
  getDifficultyColor: (difficulty: number) => string;
  getMatchingPreviewImageSrc: (file: File | null, url?: string) => string;
}

export default function QuizPreviewDialog({
  open,
  quizName,
  quizDescription,
  slides,
  questions,
  onClose,
  onSubmit,
  getDifficultyLabel,
  getDifficultyColor,
  getMatchingPreviewImageSrc,
}: QuizPreviewDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          minHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Quiz Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review your quiz before creating it
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {quizName}
          </Typography>
          {quizDescription && (
            <Typography variant="body1" color="text.secondary">
              {quizDescription}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} and {slides.length} slide{slides.length !== 1 ? 's' : ''}
          </Typography>
        </div>

        <PresentationSlidesPreview slides={slides} />
        <QuizQuestionsPreview
          questions={questions}
          getDifficultyLabel={getDifficultyLabel}
          getDifficultyColor={getDifficultyColor}
          getMatchingPreviewImageSrc={getMatchingPreviewImageSrc}
        />
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<EditIcon />}
          size="large"
        >
          Edit Quiz
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<CheckCircleIcon />}
          sx={{
            bgcolor: theme.palette.secondary.main,
            color: '#ffffff',
            fontWeight: 'bold',
            '&:hover': {
              bgcolor: theme.palette.secondary.dark,
            }
          }}
        >
          Create Quiz
        </Button>
      </DialogActions>
    </Dialog>
  );
}