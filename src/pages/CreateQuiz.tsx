import { Box, Button, Checkbox, FormControlLabel, IconButton, TextField, Typography, useTheme } from "@mui/material";
import { Quiz, QuizQuestion } from "../stores/types";

import AddIcon from '@mui/icons-material/Add';
import CategorySelector from "../components/common/CategorySelection";
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { DifficultySlider } from '../components/common/DifficultySlider';
import styles from './CreateQuiz.module.css';
import { useState } from "react";

type QuizQuestionForm = {
  question: string;
  points: number;
  difficulty: number;
  hint: string;
  type: string;
  category: string[];
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
};

export default function CreateQuiz() {
  const theme = useTheme();
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([{
    question: "",
    points: 0,
    difficulty: 1,
    hint: "",
    type: "multiple",
    category: [],
    options: Array(2).fill({ text: "", isCorrect: false }),
  }]);
  const [openDialog, setOpenDialog] = useState(false);

  const handleQuestionChange = <K extends keyof QuizQuestionForm>(
    index: number,
    field: K,
    value: QuizQuestionForm[K]
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updatedQuestions = [...questions];
    const updatedOptions = [...updatedQuestions[questionIndex].options];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value
    };
    updatedQuestions[questionIndex].options = updatedOptions;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        points: 0,
        difficulty: 1,
        hint: "",
        type: "multiple",
        category: [],
        options: Array(2).fill({ text: "", isCorrect: false }),
      },
    ]);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push({ text: "", isCorrect: false });
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (indexToDelete: number) => {
    if (questions.length <= 1) {
      alert("Must have at least one question");
      return;
    }
    const updatedQuestions = questions.filter((_, index) => index !== indexToDelete);
    setQuestions(updatedQuestions);
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length <= 2) {
      alert("Must have at least 2 options");
      return;
    }
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, index) => index !== optionIndex);
    setQuestions(updatedQuestions);
  };

  const transformQuestionForSubmission = (question: QuizQuestionForm): QuizQuestion => {
      return {
        question: question.question,
        points: question.points,
        difficulty: question.difficulty,
        hint: question.hint,
        type: question.type,
        category: question.category,
        correctAnswers: question.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt.text),
        incorrectAnswers: question.options
          .filter(opt => !opt.isCorrect)
          .map(opt => opt.text),
      } as QuizQuestion;
  };

  const handleSubmit = async () => {
    const transformedQuestions = questions.map(transformQuestionForSubmission);
    
    const quiz: Quiz = {
      quizName,
      quizDescription,
      createdBy: "Test_User",
      quizQuestions: transformedQuestions,
    };

    console.log('Submitting quiz:', JSON.stringify(quiz, null, 2));

    try {
      const response = await fetch("http://localhost:8080/api/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (response.ok) {
        alert("Quiz created successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to create quiz: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Failed to connect to server");
    }
  };

  const handleDialogOpen = () => setOpenDialog(true);
  const handleDialogClose = () => setOpenDialog(false);
  const handleDialogConfirm = async () => {
    setOpenDialog(false);
    await handleSubmit();
  };

  return (
    <div className={styles.container}>
      <Box 
        className={styles.innerBox} 
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 4px 20px rgba(0, 0, 0, 0.5)'
            : '0px 4px 20px rgba(0, 0, 0, 0.1)',
          color: theme.palette.text.primary,
        }}
      >
        <Box sx={{ padding: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create a Quiz
          </Typography>
          <TextField
            label="Quiz Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            InputLabelProps={{
              style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
            }}
            InputProps={{
              style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
            }}
          />
          <TextField
            label="Quiz Description"
            variant="outlined"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            InputLabelProps={{
              style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
            }}
            InputProps={{
              style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
            }}
          />
          {questions.map((q, questionIndex) => (
            <Box 
              key={questionIndex} 
              sx={{ 
                marginBottom: 4, 
                padding: 2, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.background.default 
                  : '#f8f8f8',
                color: theme.palette.text.primary,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Question {questionIndex + 1}</Typography>
                <IconButton 
                  onClick={() => deleteQuestion(questionIndex)}
                  sx={{ color: theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.main }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Question"
                variant="outlined"
                fullWidth
                margin="normal"
                value={q.question}
                onChange={(e) => handleQuestionChange(questionIndex, "question", e.target.value)}
                InputLabelProps={{
                  style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                }}
                InputProps={{
                  style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                }}
              />
              <TextField
                label="Points"
                type="number"
                variant="outlined"
                fullWidth
                margin="normal"
                value={q.points}
                onChange={(e) => handleQuestionChange(questionIndex, "points", parseInt(e.target.value) || 0)}
                InputLabelProps={{
                  style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                }}
                InputProps={{
                  style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                }}
              />
              <DifficultySlider 
                difficulty={q.difficulty} 
                onChange={(newVal) => handleQuestionChange(questionIndex, "difficulty", newVal)}
              />
              <TextField
                label="Hint"
                variant="outlined"
                fullWidth
                margin="normal"
                value={q.hint}
                onChange={(e) => handleQuestionChange(questionIndex, "hint", e.target.value)}
                InputLabelProps={{
                  style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                }}
                InputProps={{
                  style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                }}
              />
              <CategorySelector
                value={q.category}
                onChange={(newCategories) => handleQuestionChange(questionIndex, "category", newCategories)}
                label="Categories"
              />
              {/* Options */}
              <Typography variant="subtitle1" sx={{ mt: 2, color: theme.palette.text.primary }}>Answer Options</Typography>
              {q.options.map((option, optionIndex) => (
                <Box key={optionIndex} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label={`Option ${optionIndex + 1}`}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={option.text}
                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                    InputLabelProps={{
                      style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                    }}
                    InputProps={{
                      style: { color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'isCorrect', e.target.checked)}
                        sx={{
                          color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                          },
                        }}
                      />
                    }
                    label="Correct"
                    sx={{ color: theme.palette.text.primary }}
                  />
                  <IconButton 
                    size="small"
                    onClick={() => deleteOption(questionIndex, optionIndex)}
                    sx={{ color: theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.main }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => addOption(questionIndex)}
                sx={{ 
                  mt: 1, 
                  borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                }}
                startIcon={<AddIcon />}
              >
                Add Option
              </Button>
            </Box>
          ))}
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={addQuestion} 
            sx={{ 
              marginRight: 2,
              bgcolor: theme.palette.secondary.main,
              color: '#ffffff',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              }
            }}
          >
            Add Question
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleDialogOpen}
            sx={{ 
              bgcolor: theme.palette.secondary.main,
              color: '#ffffff',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              }
            }}
          >
            Submit Quiz
          </Button>
          <Dialog 
            open={openDialog} 
            onClose={handleDialogClose}
            PaperProps={{
              sx: {
                bgcolor: theme.palette.background.paper,
              }
            }}
          >
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: theme.palette.text.secondary }}>
                Are you sure you want to submit this quiz?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={handleDialogClose} 
                color="primary"
                sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDialogConfirm} 
                color="secondary" 
                variant="contained"
                sx={{ 
                  bgcolor: theme.palette.secondary.main,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark,
                  }
                }}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </div>
  );
}