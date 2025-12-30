import { Alert, Autocomplete, Badge, Box, Button, Card, CardContent, Checkbox, Chip, Collapse, Divider, FormControlLabel, IconButton, Pagination, Radio, RadioGroup, Snackbar, TextField, Typography, useTheme } from "@mui/material";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Quiz, QuizQuestion } from "../../stores/types";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo, useState } from "react";

import AddIcon from '@mui/icons-material/Add';
import { CSS } from '@dnd-kit/utilities';
import CategorySelector from "../../components/common/CategorySelection";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DifficultySlider } from '../../components/common/DifficultySlider';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import styles from './CreateQuiz.module.css';

type QuizQuestionForm = {
  id: string;
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

const createInitialQuestion = (): QuizQuestionForm => ({
  id: `question-${Date.now()}-${Math.random()}`,
  question: "",
  points: 0,
  difficulty: 1,
  hint: "",
  type: "multiple",
  category: [],
  options: Array(2).fill(null).map(() => ({ text: "", isCorrect: false })),
});

const QUESTIONS_PER_PAGE = 5;

// Add predefined categories (can be loaded from backend)
const PREDEFINED_CATEGORIES = [
  'Math',
  'Science',
  'History',
  'Geography',
  'Literature',
  'Sports',
  'Technology',
  'Art',
  'Music',
  'General Knowledge',
];

// Sortable Question Card Component
function SortableQuestionCard({
  question,
  index,
  globalIndex,
  expanded,
  onToggle,
  onDelete,
  onChange,
  onOptionChange,
  onAddOption,
  onDeleteOption,
  totalQuestions,
}: {
  question: QuizQuestionForm;
  index: number;
  globalIndex: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onChange: <K extends keyof QuizQuestionForm>(field: K, value: QuizQuestionForm[K]) => void;
  onOptionChange: (optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => void;
  onAddOption: () => void;
  onDeleteOption: (optionIndex: number) => void;
  totalQuestions: number;
}) {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const correctAnswersCount = question.options.filter(opt => opt.isCorrect).length;
  const isValid = question.question.trim() && correctAnswersCount > 0 && question.options.every(opt => opt.text.trim());

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.background.default
          : '#ffffff',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Compact Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Drag Handle */}
          <IconButton
            size="small"
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              color: theme.palette.text.secondary,
            }}
          >
            <DragIndicatorIcon />
          </IconButton>

          {/* Question Number & Status */}
          <Badge
            badgeContent={isValid ? '✓' : '!'}
            color={isValid ? 'success' : 'error'}
            sx={{ mr: 1 }}
          >
            <Chip
              label={`Q${globalIndex + 1}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 'bold', minWidth: 45 }}
            />
          </Badge>

          {/* Question Preview */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {question.question || <em style={{ color: theme.palette.text.disabled }}>No question text</em>}
            </Typography>
          </Box>

          {/* Points Badge */}
          <Chip
            icon={<StarIcon sx={{ fontSize: 16 }} />}
            label={`${question.points} pts`}
            size="small"
            color="secondary"
            variant="outlined"
          />

          {/* Options Count */}
          <Chip
            label={`${question.options.length} options`}
            size="small"
            variant="outlined"
          />

          {/* Expand/Collapse */}
          <IconButton size="small" onClick={onToggle}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          {/* Delete */}
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{ color: theme.palette.error.main }}
            disabled={totalQuestions <= 1}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Question Text"
              variant="outlined"
              fullWidth
              margin="dense"
              value={question.question}
              onChange={(e) => onChange("question", e.target.value)}
              required
              multiline
              rows={2}
              placeholder="Enter your question here..."
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Points"
                type="number"
                variant="outlined"
                fullWidth
                size="small"
                value={question.points === 0 ? '' : question.points}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value, 10);
                  onChange("points", Math.max(0, numValue || 0));
                }}
                onBlur={(e) => {
                  if (e.target.value === '' || question.points === 0) {
                    onChange("points", 1);
                  }
                }}
                placeholder="1"
                inputProps={{
                  min: 1,
                  step: 1,
                }}
                helperText="Point value for this question"
              />
              <TextField
                label="Hint (Optional)"
                variant="outlined"
                fullWidth
                size="small"
                value={question.hint}
                onChange={(e) => onChange("hint", e.target.value)}
                placeholder="Add a helpful hint..."
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <DifficultySlider
                difficulty={question.difficulty}
                onChange={(newVal) => onChange("difficulty", newVal)}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Autocomplete
                multiple
                freeSolo
                options={PREDEFINED_CATEGORIES}
                value={question.category}
                onChange={(_, newValue) => {
                  onChange("category", newValue);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Categories"
                    placeholder="Select or type categories..."
                    helperText="Choose existing categories or create new ones"
                  />
                )}
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Answer Options - Multi-Select with Checkboxes */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                Answer Options
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Check all correct answers (multiple selections allowed)
              </Typography>

              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.01)',
                }}
              >
                {question.options.map((option, optionIndex) => (
                  <Box
                    key={optionIndex}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1,
                      border: `2px solid ${
                        option.isCorrect
                          ? theme.palette.success.main
                          : theme.palette.divider
                      }`,
                      backgroundColor: option.isCorrect
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(76, 175, 80, 0.08)'
                          : 'rgba(76, 175, 80, 0.04)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    {/* Checkbox for Correct Answer */}
                    <Checkbox
                      checked={option.isCorrect}
                      onChange={(e) => onOptionChange(optionIndex, 'isCorrect', e.target.checked)}
                      size="small"
                      sx={{
                        color: theme.palette.text.secondary,
                        '&.Mui-checked': {
                          color: theme.palette.success.main,
                        },
                        p: 0.5,
                      }}
                    />

                    {/* Option Letter/Number */}
                    <Box
                      sx={{
                        minWidth: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: option.isCorrect
                          ? theme.palette.success.main
                          : theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                        color: option.isCorrect
                          ? '#fff'
                          : theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </Box>

                    {/* Answer Text Input */}
                    <TextField
                      variant="standard"
                      fullWidth
                      value={option.text}
                      onChange={(e) => onOptionChange(optionIndex, 'text', e.target.value)}
                      placeholder={`Enter answer option ${String.fromCharCode(65 + optionIndex)}`}
                      InputProps={{
                        disableUnderline: false,
                        sx: {
                          fontSize: '0.95rem',
                          '& .MuiInput-input': {
                            py: 0.5,
                          },
                        },
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottom: `1px solid ${theme.palette.divider}`,
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottom: `2px solid ${theme.palette.primary.main}`,
                        },
                      }}
                    />

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      onClick={() => onDeleteOption(optionIndex)}
                      disabled={question.options.length <= 2}
                      sx={{
                        color: theme.palette.error.main,
                        flexShrink: 0,
                        '&.Mui-disabled': {
                          color: theme.palette.action.disabled,
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={onAddOption}
                  sx={{ mt: 1 }}
                  startIcon={<AddIcon />}
                  fullWidth
                >
                  Add Answer Option
                </Button>
              </Card>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function CreateQuiz() {
  const theme = useTheme();
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([createInitialQuestion()]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set([questions[0].id]));
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Pagination
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const end = start + QUESTIONS_PER_PAGE;
    return questions.slice(start, end).map((q, idx) => ({
      ...q,
      globalIndex: start + idx,
    }));
  }, [questions, currentPage]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQuestionChange = <K extends keyof QuizQuestionForm>(
    globalIndex: number,
    field: K,
    value: QuizQuestionForm[K]
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (globalIndex: number, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updatedQuestions = [...questions];
    const updatedOptions = [...updatedQuestions[globalIndex].options];
    
    // Allow multiple correct answers (checkbox behavior)
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value
    };
    
    updatedQuestions[globalIndex].options = updatedOptions;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestion = createInitialQuestion();
    // Set default points to 1 instead of 0
    newQuestion.points = 1;
    setQuestions([...questions, newQuestion]);
    setExpandedQuestions(new Set([newQuestion.id]));
    const newPage = Math.ceil((questions.length + 1) / QUESTIONS_PER_PAGE);
    setCurrentPage(newPage);
  };

  const addOption = (globalIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].options.push({ text: "", isCorrect: false });
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (globalIndex: number) => {
    if (questions.length <= 1) {
      showSnackbar("Must have at least one question", "error");
      return;
    }
    const questionId = questions[globalIndex].id;
    const updatedQuestions = questions.filter((_, index) => index !== globalIndex);
    setQuestions(updatedQuestions);
    
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });

    if (paginatedQuestions.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const deleteOption = (globalIndex: number, optionIndex: number) => {
    if (questions[globalIndex].options.length <= 2) {
      showSnackbar("Must have 2 options at least", "error");
      return;
    }
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].options = updatedQuestions[globalIndex].options.filter((_, index) => index !== optionIndex);
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

  const validateQuiz = (): boolean => {
    if (!quizName.trim()) {
      showSnackbar("Quiz name is required", "error");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showSnackbar(`Question ${i + 1} text is required`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }

      const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        showSnackbar(`Question ${i + 1} must have at least one correct answer`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }

      const allOptionsFilled = q.options.every(opt => opt.text.trim());
      if (!allOptionsFilled) {
        showSnackbar(`All options for Question ${i + 1} must be filled`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    const transformedQuestions = questions.map(transformQuestionForSubmission);

    const quiz: Quiz = {
      quizName,
      quizDescription,
      createdBy: "Test_User",
      quizQuestions: transformedQuestions,
    };

    try {
      const response = await fetch("http://localhost:8080/api/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (response.ok) {
        showSnackbar("Quiz created successfully!", "success");
        resetForm();
        setPreviewOpen(false);
      } else {
        const errorData = await response.json();
        showSnackbar(`Failed to create quiz: ${errorData.error || 'Unknown error'}`, "error");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      showSnackbar("Failed to connect to server", "error");
    }
  };

  const resetForm = () => {
    const newQuestion = createInitialQuestion();
    newQuestion.points = 1; // Default to 1 point
    setQuizName("");
    setQuizDescription("");
    setQuestions([newQuestion]);
    setExpandedQuestions(new Set([newQuestion.id]));
    setCurrentPage(1);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handlePreviewOpen = () => {
    if (validateQuiz()) {
      setPreviewOpen(true);
    }
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 2) return "Easy";
    if (difficulty <= 4) return "Medium";
    if (difficulty <= 6) return "Hard";
    return "Expert";
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return theme.palette.success.main;
    if (difficulty <= 4) return theme.palette.warning.main;
    if (difficulty <= 6) return theme.palette.error.main;
    return theme.palette.error.dark;
  };

  const expandAll = () => {
    setExpandedQuestions(new Set(paginatedQuestions.map(q => q.id)));
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
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
        <Box sx={{ padding: { xs: 2, sm: 4 } }}>
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Create a Quiz
          </Typography>
          
          {/* Quiz Info Section */}
          <Card 
            sx={{ 
              mb: 4, 
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa',
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Quiz Information
              </Typography>
              <TextField
                label="Quiz Name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                required
              />
              <TextField
                label="Quiz Description"
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Questions Header with Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" fontWeight="600">
                Questions
              </Typography>
              <Chip
                label={`${questions.length} total`}
                size="small"
                color="primary"
              />
              <Chip
                label={`${questions.reduce((sum, q) => sum + q.points, 0)} pts`}
                size="small"
                color="secondary"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={expandAll}>Expand All</Button>
              <Button size="small" onClick={collapseAll}>Collapse All</Button>
            </Box>
          </Box>

          {/* Drag and Drop Context */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={paginatedQuestions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {paginatedQuestions.map((q, idx) => (
                <SortableQuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  globalIndex={q.globalIndex}
                  expanded={expandedQuestions.has(q.id)}
                  onToggle={() => toggleExpanded(q.id)}
                  onDelete={() => deleteQuestion(q.globalIndex)}
                  onChange={(field, value) => handleQuestionChange(q.globalIndex, field, value)}
                  onOptionChange={(optionIndex, field, value) =>
                    handleOptionChange(q.globalIndex, optionIndex, field, value)
                  }
                  onAddOption={() => addOption(q.globalIndex)}
                  onDeleteOption={(optionIndex) => deleteOption(q.globalIndex, optionIndex)}
                  totalQuestions={questions.length}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={addQuestion}
              startIcon={<AddIcon />}
              size="large"
            >
              Add Question
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handlePreviewOpen}
              startIcon={<VisibilityIcon />}
              size="large"
              sx={{ 
                bgcolor: theme.palette.secondary.main,
                color: '#ffffff',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: theme.palette.secondary.dark,
                }
              }}
            >
              Preview & Submit Quiz
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={handlePreviewClose}
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
          {/* Quiz Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {quizName}
            </Typography>
            {quizDescription && (
              <Typography variant="body1" color="text.secondary">
                {quizDescription}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`${questions.length} Question${questions.length !== 1 ? 's' : ''}`} 
                size="small" 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`${questions.reduce((sum, q) => sum + q.points, 0)} Total Points`} 
                size="small"
                color="primary"
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Questions Preview */}
          {questions.map((q, qIndex) => (
            <Card 
              key={q.id}
              sx={{ 
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      {qIndex + 1}. {q.question}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    <Chip 
                      label={`${q.points} pts`} 
                      size="small" 
                      color="primary"
                    />
                    <Chip 
                      label={getDifficultyLabel(q.difficulty)} 
                      size="small"
                      sx={{ 
                        bgcolor: getDifficultyColor(q.difficulty),
                        color: '#fff',
                      }}
                    />
                  </Box>
                </Box>

                {q.hint && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                    💡 Hint: {q.hint}
                  </Typography>
                )}

                {q.category.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {q.category.map((cat, idx) => (
                      <Chip 
                        key={idx}
                        label={cat} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}

                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                  Answer Options:
                </Typography>

                {q.options.map((option, oIndex) => (
                  <Box 
                    key={oIndex}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      mb: 1,
                      borderRadius: 1,
                      border: `2px solid ${option.isCorrect ? theme.palette.success.main : theme.palette.divider}`,
                      backgroundColor: option.isCorrect 
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(76, 175, 80, 0.1)'
                          : 'rgba(76, 175, 80, 0.05)'
                        : 'transparent',
                    }}
                  >
                    {option.isCorrect ? (
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: theme.palette.text.disabled, mr: 1 }} />
                    )}
                    <Typography 
                      variant="body1"
                      sx={{ 
                        fontWeight: option.isCorrect ? 600 : 400,
                      }}
                    >
                      {option.text}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Button 
            onClick={handlePreviewClose} 
            variant="outlined"
            startIcon={<EditIcon />}
            size="large"
          >
            Edit Quiz
          </Button>
          <Button 
            onClick={handleSubmit} 
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

      {/* Success/Error Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}