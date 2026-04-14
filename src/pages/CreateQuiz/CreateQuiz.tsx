import { Alert, Autocomplete, Badge, Box, Button, Card, CardContent, Checkbox, Chip, Collapse, Divider, IconButton, MenuItem, Radio, Snackbar, TextField, Typography, useTheme } from "@mui/material";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Quiz, QuizItem, QuizQuestion } from "../../stores/types";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import AddIcon from '@mui/icons-material/Add';
import { CSS } from '@dnd-kit/utilities';
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
import type { DragEvent as ReactDragEvent } from "react";
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { backendUrl } from '../../util/backendConfig';
import styles from './CreateQuiz.module.css';

type QuizQuestionForm = {
  id: string;
  question: string;
  points: number;
  difficulty: number;
  hint: string;
  imageUrl: string;
  imageId?: string;
  imageFile: File | null;
  explanation: string;
  type: string;
  acceptedAnswers: string[];
  acceptedAnswerInput: string;
  category: string[];
  matchingPairs: Array<{
    left: string;
    right: string;
    leftImageUrl?: string;
    leftImageId?: string;
    leftImageFile: File | null;
    rightImageUrl?: string;
    rightImageId?: string;
    rightImageFile: File | null;
  }>;
  options: Array<{
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
    imageId?: string;
    imageFile: File | null;
  }>;
};

type PresentationSlideForm = {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
};

type TimelineItemRef = {
  id: string;
  kind: "slide" | "question";
  refId: string;
};

const createMatchingPairs = () => ([
  { left: "", right: "", leftImageUrl: "", leftImageId: "", leftImageFile: null, rightImageUrl: "", rightImageId: "", rightImageFile: null },
  { left: "", right: "", leftImageUrl: "", leftImageId: "", leftImageFile: null, rightImageUrl: "", rightImageId: "", rightImageFile: null },
]);

const createInitialQuestion = (): QuizQuestionForm => ({
  id: `question-${Date.now()}-${Math.random()}`,
  question: "",
  points: 1,
  difficulty: 1,
  hint: "",
  imageUrl: "",
  imageId: "",
  imageFile: null,
  explanation: "",
  type: "multiple",
  acceptedAnswers: [],
  acceptedAnswerInput: "",
  category: [],
  matchingPairs: createMatchingPairs(),
  options: [
    { text: "", isCorrect: true, imageUrl: "", imageId: "", imageFile: null },
    { text: "", isCorrect: false, imageUrl: "", imageId: "", imageFile: null },
  ],
});

const createInitialSlide = (): PresentationSlideForm => ({
  id: `slide-${Date.now()}-${Math.random()}`,
  title: "",
  content: "",
  imageUrl: "",
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

const QUESTION_TYPE_OPTIONS = [
  { value: 'multiple', label: 'Multiple Choice (Single Answer)' },
  { value: 'multi_select', label: 'Multi-Select (Multiple Answers)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'essay', label: 'Essay' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'match_the_phrase', label: 'Match the Phrase' },
  { value: 'matching', label: 'Matching' },
  { value: 'image_based', label: 'Image Based' },
  { value: 'calendar', label: 'Calendar' },
] as const;

// Sortable Question Card Component
function SortableQuestionCard({
  question,
  sortableId,
  index,
  globalIndex,
  expanded,
  onToggle,
  onDelete,
  onChange,
  onOptionChange,
  onAddOption,
  onDeleteOption,
  onAddAcceptedAnswer,
  onRemoveAcceptedAnswer,
  onAddMatchingPair,
  onRemoveMatchingPair,
  onUpdateMatchingPair,
  onUpdateMatchingPairImage,
  totalQuestions,
}: {
  question: QuizQuestionForm;
  sortableId?: string;
  index: number;
  globalIndex: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onChange: <K extends keyof QuizQuestionForm>(field: K, value: QuizQuestionForm[K]) => void;
  onOptionChange: (
    optionIndex: number,
    field: 'text' | 'isCorrect' | 'imageUrl' | 'imageId' | 'imageFile',
    value: string | boolean | File | null
  ) => void;
  onAddOption: () => void;
  onDeleteOption: (optionIndex: number) => void;
  onAddAcceptedAnswer: () => void;
  onRemoveAcceptedAnswer: (answerIndex: number) => void;
  onAddMatchingPair: () => void;
  onRemoveMatchingPair: (pairIndex: number) => void;
  onUpdateMatchingPair: (pairIndex: number, field: 'left' | 'right', value: string) => void;
  onUpdateMatchingPairImage: (pairIndex: number, side: 'left' | 'right', file: File | null) => void;
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
  } = useSortable({ id: sortableId || question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const correctAnswersCount = question.options.filter(opt => opt.isCorrect).length;
  const isFreeTextType = question.type === 'short_answer';
  const isCalendarType = question.type === 'calendar';
  const isFillInBlankType = question.type === 'fill_in_blank';
  const isNumericalType = question.type === 'numerical';
  const isPairType = question.type === 'matching';
  const isPhraseMatchType = question.type === 'match_the_phrase';
  const allowsNoCorrect = question.type === 'multi_select';
  const blankSegments = question.question.split(/_{3,}/);
  const hasBlankTokens = blankSegments.length > 1;
  const blankAnswersValid =
    hasBlankTokens &&
    blankSegments.slice(0, -1).every((_, blankIndex) =>
      (question.acceptedAnswers[blankIndex] || '')
        .split('|')
        .map((value) => value.trim())
        .filter(Boolean)
        .length > 0
    );
  const hasOptionContent = (option: QuizQuestionForm['options'][number]) =>
    Boolean(option.text.trim()) || Boolean(option.imageFile) || Boolean((option.imageUrl || '').trim()) || Boolean((option.imageId || '').trim());
  const isValid = isFreeTextType
    ? question.question.trim() && question.acceptedAnswers.length > 0
    : isCalendarType
      ? question.question.trim() && question.acceptedAnswers.length > 0 && question.acceptedAnswers.every((date) => /^\d{4}-\d{2}-\d{2}$/.test((date || '').trim()))
    : isNumericalType
      ? question.question.trim() && Number.isFinite(Number((question.acceptedAnswers[0] || '').trim()))
    : isFillInBlankType
      ? question.question.trim() && blankAnswersValid
    : isPhraseMatchType
      ? question.question.trim() && blankAnswersValid && question.options.every(hasOptionContent)
    : isPairType
      ? question.question.trim() && question.matchingPairs.length >= 2 && question.matchingPairs.every(pair => pair.left.trim() && pair.right.trim())
      : question.question.trim() && (allowsNoCorrect || correctAnswersCount > 0) && question.options.every(hasOptionContent);
  const isEssayType = question.type === 'essay';
  const isOrderType = question.type === 'ranking' || question.type === 'ordering';
  const isSingleCorrectType = question.type === 'multiple' || question.type === 'dropdown' || question.type === 'true_false';
  const usesOptionsEditor = !isFreeTextType && !isCalendarType && !isFillInBlankType && !isNumericalType && !isPhraseMatchType;
  const showCorrectSelector = !isEssayType && !isOrderType;
  const phraseBlankCount = Math.max(0, blankSegments.length - 1);
  const [questionCursorPos, setQuestionCursorPos] = useState<number | null>(null);
  const [draggedPhraseBlankIndex, setDraggedPhraseBlankIndex] = useState<number | null>(null);
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(null);
  const [dragOverQuestionImage, setDragOverQuestionImage] = useState(false);
  const questionInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const canAttachOptionImage = question.type !== 'true_false';

  const handleOptionImageDrop = (event: ReactDragEvent<HTMLDivElement>, optionIndex: number) => {
    if (!canAttachOptionImage) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOverOptionIndex(null);

    const fileList = event.dataTransfer?.files;
    if (!fileList || fileList.length === 0) return;

    const imageFile = Array.from(fileList).find((file) => file.type.startsWith('image/')) || null;
    if (!imageFile) return;

    onOptionChange(optionIndex, 'imageFile', imageFile);
  };

  const handleQuestionImageDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverQuestionImage(false);

    const fileList = event.dataTransfer?.files;
    if (!fileList || fileList.length === 0) return;

    const imageFile = Array.from(fileList).find((file) => file.type.startsWith('image/')) || null;
    if (!imageFile) return;

    onChange('imageFile', imageFile);
  };

  const handleFillBlankAnswerChange = (blankIndex: number, value: string) => {
    const nextAnswers = [...question.acceptedAnswers];
    nextAnswers[blankIndex] = value;
    onChange('acceptedAnswers', nextAnswers);
  };

  const handlePhraseAnswerChange = (blankIndex: number, value: string) => {
    const nextAnswers = [...question.acceptedAnswers];
    nextAnswers[blankIndex] = value;
    onChange('acceptedAnswers', nextAnswers);

    const syncedWordBank = nextAnswers.slice(0, phraseBlankCount).map((answer, index) => ({
      text: answer.trim() || question.options[index]?.text || '',
      isCorrect: false,
      imageUrl: question.options[index]?.imageUrl || '',
      imageId: question.options[index]?.imageId || '',
      imageFile: question.options[index]?.imageFile || null,
    }));
    const remainingWords = question.options.slice(phraseBlankCount);
    onChange('options', [...syncedWordBank, ...remainingWords]);
  };

  const syncFillBlankStructure = (nextQuestionText: string) => {
    const blankCount = Math.max(0, nextQuestionText.split('____').length - 1);
    const nextAnswers = Array.from({ length: blankCount }, (_, index) => question.acceptedAnswers[index] || '');
    onChange('acceptedAnswers', nextAnswers);
  };

  const syncPhraseStructure = (nextQuestionText: string) => {
    const nextBlankCount = Math.max(0, nextQuestionText.split(/_{3,}/).length - 1);
    const nextAnswers = Array.from({ length: nextBlankCount }, (_, index) => question.acceptedAnswers[index] || '');
    onChange('acceptedAnswers', nextAnswers);

    const syncedWordBank = nextAnswers.map((answer, index) => ({
      text: answer.trim() || question.options[index]?.text || '',
      isCorrect: false,
      imageUrl: question.options[index]?.imageUrl || '',
      imageId: question.options[index]?.imageId || '',
      imageFile: question.options[index]?.imageFile || null,
    }));
    const remainingWords = question.options.slice(nextBlankCount);
    onChange('options', [...syncedWordBank, ...remainingWords]);
  };

  const addPhraseBlank = () => {
    const position = questionCursorPos ?? question.question.length;
    const before = question.question.slice(0, position);
    const after = question.question.slice(position);
    const spacerBefore = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
    const spacerAfter = after.length > 0 && !/^\s/.test(after) ? ' ' : '';
    const nextQuestionText = `${before}${spacerBefore}___${spacerAfter}${after}`;
    onChange('question', nextQuestionText);
    syncPhraseStructure(nextQuestionText);
  };

  const movePhraseBlank = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const nextAnswers = [...question.acceptedAnswers];
    const [movedAnswer] = nextAnswers.splice(fromIndex, 1);
    nextAnswers.splice(toIndex, 0, movedAnswer || '');
    onChange('acceptedAnswers', nextAnswers);

    const pinnedWordBank = question.options.slice(0, phraseBlankCount);
    const extraWordBank = question.options.slice(phraseBlankCount);
    const nextPinnedWordBank = [...pinnedWordBank];
    const [movedWord] = nextPinnedWordBank.splice(fromIndex, 1);
    nextPinnedWordBank.splice(toIndex, 0, movedWord || { text: '', isCorrect: false, imageUrl: '', imageId: '', imageFile: null });
    onChange('options', [...nextPinnedWordBank, ...extraWordBank]);
  };

  const removePhraseBlank = () => {
    const blankMatches = question.question.match(/_{3,}/g) || [];
    if (blankMatches.length <= 1) return;

    const nextQuestionText = question.question.replace(/\s*_{3,}(?!.*_{3,})/, '').trimEnd();
    onChange('question', nextQuestionText);
    syncPhraseStructure(nextQuestionText);
  };

  const addFillBlank = () => {
    const separator = question.question.trim().length > 0 && !question.question.endsWith(' ') ? ' ' : '';
    const nextQuestionText = `${question.question}${separator}____`;
    onChange('question', nextQuestionText);
    syncFillBlankStructure(nextQuestionText);
  };

  const removeFillBlankAt = (blankIndex: number) => {
    const blankParts = question.question.split('____');
    const blankCount = Math.max(0, blankParts.length - 1);
    if (blankCount <= 1 || blankIndex < 0 || blankIndex >= blankCount) return;

    const nextParts = [...blankParts];
    nextParts[blankIndex] = `${nextParts[blankIndex]}${nextParts[blankIndex + 1]}`;
    nextParts.splice(blankIndex + 1, 1);
    const nextQuestionText = nextParts.join('____').replace(/\s{2,}/g, ' ').trimEnd();

    const nextAnswers = question.acceptedAnswers.filter((_, index) => index !== blankIndex);
    onChange('question', nextQuestionText);
    onChange('acceptedAnswers', nextAnswers);
  };

  const removeFillBlank = () => {
    const blankParts = question.question.split('____');
    const blankCount = Math.max(0, blankParts.length - 1);
    if (blankCount <= 1) return;

    removeFillBlankAt(blankCount - 1);
  };

  const getBlankAlternatives = (blankIndex: number) =>
    (question.acceptedAnswers[blankIndex] || "")
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);

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
          {isFreeTextType ? (
            <Chip
              label="Text answer"
              size="small"
              variant="outlined"
            />
          ) : isPairType ? (
            <Chip
              label={`${question.matchingPairs.length} pairs`}
              size="small"
              variant="outlined"
            />
          ) : (
            <Chip
              label={`${question.options.length} options`}
              size="small"
              variant="outlined"
            />
          )}

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
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Question Type"
                select
                variant="outlined"
                fullWidth
                size="small"
                value={question.type}
                onChange={(e) => onChange("type", e.target.value as QuizQuestionForm['type'])}
              >
                {QUESTION_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
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

            <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Image URL (Optional)"
                variant="outlined"
                fullWidth
                size="small"
                value={question.imageUrl}
                onChange={(e) => onChange("imageUrl", e.target.value)}
                placeholder="https://example.com/question-image.png"
              />
              <Box
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!dragOverQuestionImage) {
                    setDragOverQuestionImage(true);
                  }
                }}
                onDragLeave={() => setDragOverQuestionImage(false)}
                onDrop={handleQuestionImageDrop}
                sx={{
                  minWidth: { xs: '100%', sm: 220 },
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: dragOverQuestionImage ? 'primary.main' : 'divider',
                  bgcolor: dragOverQuestionImage
                    ? 'action.hover'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(0,0,0,0.01)',
                  transition: 'all 0.2s ease',
                  boxShadow: dragOverQuestionImage ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{
                    minHeight: 40,
                    border: 0,
                    justifyContent: 'space-between',
                    px: 1.5,
                    '&:hover': { border: 0 },
                    color: dragOverQuestionImage ? 'primary.main' : 'inherit',
                  }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {dragOverQuestionImage
                        ? 'Drop image to attach'
                        : question.imageFile
                          ? 'Question Image Selected'
                          : 'Upload Question Image'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Drag and drop or click to browse
                    </Typography>
                  </Box>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      onChange('imageFile', file);
                    }}
                  />
                </Button>
              </Box>
              <TextField
                label="Explanation (Optional)"
                variant="outlined"
                fullWidth
                size="small"
                value={question.explanation}
                onChange={(e) => onChange("explanation", e.target.value)}
                placeholder="Explain why the answer is correct..."
              />
            </Box>

            <Box
              sx={{
                mt: 1.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
                gap: 2,
                alignItems: 'start',
              }}
            >
              <Box sx={{ maxWidth: { xs: '100%', md: 360 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Difficulty
                </Typography>
                <Box sx={{ transform: 'scale(0.92)', transformOrigin: 'top left', width: '108%' }}>
                  <DifficultySlider
                    difficulty={question.difficulty}
                    onChange={(newVal) => onChange("difficulty", newVal)}
                  />
                </Box>
              </Box>

              <Box sx={{ maxWidth: { xs: '100%', md: 520 } }}>
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
                      size="small"
                      variant="outlined"
                      label="Categories"
                      placeholder="Select or type categories..."
                      helperText="Choose existing categories or create new ones"
                    />
                  )}
                />
              </Box>
            </Box>

            <TextField
              label="Question Text"
              variant="outlined"
              fullWidth
              margin="dense"
              value={question.question}
              inputRef={questionInputRef}
              onClick={() => setQuestionCursorPos(questionInputRef.current?.selectionStart ?? null)}
              onChange={(e) => {
                const nextQuestionText = e.target.value;
                setQuestionCursorPos(e.target.selectionStart ?? null);
                onChange("question", nextQuestionText);

                if (isPhraseMatchType) {
                  const nextBlankCount = Math.max(0, nextQuestionText.split(/_{3,}/).length - 1);
                  const nextAnswers = Array.from({ length: nextBlankCount }, (_, index) => question.acceptedAnswers[index] || '');
                  onChange('acceptedAnswers', nextAnswers);

                  const syncedWordBank = nextAnswers.map((answer, index) => ({
                    text: answer.trim() || question.options[index]?.text || '',
                    isCorrect: false,
                    imageUrl: question.options[index]?.imageUrl || '',
                    imageId: question.options[index]?.imageId || '',
                    imageFile: question.options[index]?.imageFile || null,
                  }));
                  const remainingWords = question.options.slice(nextBlankCount);
                  onChange('options', [...syncedWordBank, ...remainingWords]);
                }
              }}
              required
              multiline
              rows={2}
              placeholder="Enter your question here..."
            />

            {isPhraseMatchType && (
              <Box sx={{ mt: 1.25, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5 }}>
                  Drag-to-Match Phrase Editor
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Write the sentence using blanks, then add the correct word for each blank and a word bank for dragging.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" onClick={addPhraseBlank} startIcon={<AddIcon />}>
                    Add Blank At Cursor
                  </Button>
                  <Button size="small" variant="outlined" onClick={removePhraseBlank} disabled={phraseBlankCount <= 1}>
                    Remove Blank
                  </Button>
                </Box>

                {hasBlankTokens ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    {blankSegments.map((segment, index) => (
                      <Fragment key={`phrase-segment-${index}`}>
                        {segment && (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {segment}
                          </Typography>
                        )}
                        {index < blankSegments.length - 1 && (
                          <Box
                            sx={{ minWidth: 200, flex: '1 1 200px' }}
                            draggable
                            onDragStart={() => setDraggedPhraseBlankIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (draggedPhraseBlankIndex === null) return;
                              movePhraseBlank(draggedPhraseBlankIndex, index);
                              setDraggedPhraseBlankIndex(null);
                            }}
                            onDragEnd={() => setDraggedPhraseBlankIndex(null)}
                          >
                            <TextField
                              size="small"
                              fullWidth
                              value={question.acceptedAnswers[index] || ''}
                              onChange={(e) => handlePhraseAnswerChange(index, e.target.value)}
                              placeholder={`Answer for blank ${index + 1}`}
                              InputProps={{
                                startAdornment: (
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      border: `1px solid ${theme.palette.primary.main}`,
                                      color: theme.palette.primary.main,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      mr: 1,
                                      flexShrink: 0,
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                                    }}
                                  >
                                    {index + 1}
                                  </Box>
                                ),
                                endAdornment: (
                                  <DragIndicatorIcon fontSize="small" color="disabled" />
                                ),
                              }}
                              sx={{
                                bgcolor: theme.palette.background.paper,
                                borderRadius: 2,
                                '& .MuiInputBase-input': {
                                  py: 1.1,
                                },
                              }}
                            />
                          </Box>
                        )}
                      </Fragment>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Insert blanks using ___ in the sentence. Example: The ___ jumps over the ___ dog.
                  </Typography>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0.5 }}>
                    Word Bank
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Add words that players can drag into the blanks.
                  </Typography>
                  {question.options.map((option, optionIndex) => (
                    <Box key={`phrase-option-${optionIndex}`} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <TextField
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={option.text}
                        onChange={(e) => onOptionChange(optionIndex, 'text', e.target.value)}
                        placeholder={optionIndex < phraseBlankCount ? `Correct word ${optionIndex + 1}` : `Word ${optionIndex + 1}`}
                        disabled={optionIndex < phraseBlankCount}
                        InputProps={{
                          startAdornment: (
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                border: `1px solid ${optionIndex < phraseBlankCount ? theme.palette.success.main : theme.palette.divider}`,
                                color: optionIndex < phraseBlankCount ? theme.palette.success.main : theme.palette.text.secondary,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                mr: 1,
                                flexShrink: 0,
                                bgcolor: optionIndex < phraseBlankCount
                                  ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(76, 175, 80, 0.08)')
                                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                              }}
                            >
                              {optionIndex < phraseBlankCount ? optionIndex + 1 : optionIndex + 1}
                            </Box>
                          ),
                        }}
                      />
                      <IconButton size="small" onClick={() => onDeleteOption(optionIndex)} disabled={question.options.length <= 1 || optionIndex < phraseBlankCount} sx={{ color: theme.palette.error.main }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" size="small" onClick={onAddOption} startIcon={<AddIcon />}>
                    Add Word
                  </Button>
                </Box>
              </Box>
            )}

            {isFillInBlankType && (
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.015)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      Fill-in-the-Blank Editor
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add blanks in the sentence, then fill in the correct answer for each one.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={addFillBlank}
                  >
                    Insert Blank
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={removeFillBlank}
                    disabled={blankSegments.length <= 2}
                  >
                    Delete Last
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25, mt: 1.5 }}>
                  {blankSegments.map((segment, index) => (
                    <Fragment key={`fill-blank-segment-${index}`}>
                      {segment && (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {segment}
                        </Typography>
                      )}

                      {index < blankSegments.length - 1 && (
                        <Box sx={{ minWidth: 220, flex: '1 1 220px' }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={question.acceptedAnswers[index] || ''}
                            onChange={(e) => handleFillBlankAnswerChange(index, e.target.value)}
                            placeholder={`Answer for blank ${index + 1}`}
                            InputProps={{
                              startAdornment: (
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: `1px solid ${theme.palette.primary.main}`,
                                    color: theme.palette.primary.main,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    mr: 1,
                                    flexShrink: 0,
                                    bgcolor: theme.palette.mode === 'dark'
                                      ? 'rgba(33, 150, 243, 0.12)'
                                      : 'rgba(33, 150, 243, 0.08)',
                                  }}
                                >
                                  {index + 1}
                                </Box>
                              ),
                              endAdornment: (
                                <IconButton
                                  size="small"
                                  onClick={() => removeFillBlankAt(index)}
                                  disabled={blankSegments.length <= 2}
                                  sx={{ ml: 0.5, color: theme.palette.error.main }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              ),
                            }}
                            sx={{
                              bgcolor: theme.palette.background.paper,
                              borderRadius: 2,
                              '& .MuiInputBase-input': {
                                py: 1.1,
                              },
                            }}
                          />
                          <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {getBlankAlternatives(index).length > 0 ? (
                              getBlankAlternatives(index).map((alt, altIdx) => (
                                <Chip
                                  key={`blank-${index}-alt-${altIdx}`}
                                  label={alt}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: 22 }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Add alternatives with | (example: color|colour)
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Fragment>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {isFreeTextType && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                  Accepted Answers
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Add one or more accepted answers. Players can submit any of these.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={question.acceptedAnswerInput}
                    onChange={(e) => onChange('acceptedAnswerInput', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onAddAcceptedAnswer();
                      }
                    }}
                    placeholder={question.type === 'fill_in_blank' ? 'e.g. 3' : 'e.g. Pacific Ocean'}
                  />
                  <Button variant="contained" onClick={onAddAcceptedAnswer} sx={{ minWidth: 120 }}>
                    Add Answer
                  </Button>
                </Box>

                {question.acceptedAnswers.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {question.acceptedAnswers.map((ans, idx) => (
                      <Chip
                        key={`${ans}-${idx}`}
                        label={ans}
                        color="success"
                        variant="outlined"
                        onDelete={() => onRemoveAcceptedAnswer(idx)}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No accepted answers yet.
                  </Typography>
                )}
              </Box>
            )}

            {isNumericalType && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                  Correct Numerical Answer
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Enter the exact number players must submit.
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={question.acceptedAnswers[0] || ''}
                  onChange={(e) => onChange('acceptedAnswers', [e.target.value])}
                  placeholder="e.g. 3.14"
                />
              </Box>
            )}

            {isCalendarType && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                  Correct Date(s)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Pick one or more correct dates using the calendar picker (YYYY-MM-DD).
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={question.acceptedAnswerInput}
                    onChange={(e) => onChange('acceptedAnswerInput', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onAddAcceptedAnswer();
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    onClick={onAddAcceptedAnswer}
                    sx={{ minWidth: 120 }}
                    disabled={!/^\d{4}-\d{2}-\d{2}$/.test((question.acceptedAnswerInput || '').trim())}
                  >
                    Add Date
                  </Button>
                </Box>

                {question.acceptedAnswers.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {question.acceptedAnswers.map((date, idx) => (
                      <Chip
                        key={`${date}-${idx}`}
                        label={date}
                        color="success"
                        variant="outlined"
                        onDelete={() => onRemoveAcceptedAnswer(idx)}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No dates selected yet.
                  </Typography>
                )}
              </Box>
            )}

            {/* Answer Options - Multi-Select with Checkboxes */}
            {usesOptionsEditor && <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                {isOrderType ? 'Items (drag order in game)' : isPairType ? 'Matching Pairs' : 'Answer Options'}
              </Typography>
              {isEssayType ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Essay questions do not require predefined answer options.
                </Alert>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  {isPairType
                    ? 'Enter each correct pair. The left and right values will be matched together in the game.'
                    : isOrderType
                    ? 'Add and arrange items. The displayed order will be treated as the correct order.'
                    : isSingleCorrectType
                      ? 'Select one correct answer.'
                      : 'Check all correct answers (multiple selections allowed).'}
                </Typography>
              )}

              {!isEssayType && (isPairType ? (
                <Card
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 0, 0, 0.01)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Use the left column for items on the left side and the right column for their matches.
                  </Typography>

                  {question.matchingPairs.map((pair, pairIndex) => (
                    <Box
                      key={pairIndex}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' },
                        gap: 1,
                        alignItems: 'start',
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'grid', gap: 0.75 }}>
                        <TextField
                          label={`Left item ${pairIndex + 1}`}
                          variant="outlined"
                          fullWidth
                          size="small"
                          value={pair.left}
                          onChange={(e) => onUpdateMatchingPair(pairIndex, 'left', e.target.value)}
                        />
                        <Button variant="outlined" component="label" size="small" sx={{ justifyContent: 'flex-start' }}>
                          {pair.leftImageFile || pair.leftImageUrl ? 'Left Image Set' : 'Add Left Image'}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              onUpdateMatchingPairImage(pairIndex, 'left', file);
                            }}
                          />
                        </Button>
                        {pair.leftImageFile || pair.leftImageUrl ? (
                          <Box
                            component="img"
                            src={pair.leftImageFile ? URL.createObjectURL(pair.leftImageFile) : (pair.leftImageUrl || '')}
                            alt={`Left item ${pairIndex + 1}`}
                            sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                          />
                        ) : null}
                      </Box>
                      <Box sx={{ display: 'grid', gap: 0.75 }}>
                        <TextField
                          label={`Right item ${pairIndex + 1}`}
                          variant="outlined"
                          fullWidth
                          size="small"
                          value={pair.right}
                          onChange={(e) => onUpdateMatchingPair(pairIndex, 'right', e.target.value)}
                        />
                        <Button variant="outlined" component="label" size="small" sx={{ justifyContent: 'flex-start' }}>
                          {pair.rightImageFile || pair.rightImageUrl ? 'Right Image Set' : 'Add Right Image'}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              onUpdateMatchingPairImage(pairIndex, 'right', file);
                            }}
                          />
                        </Button>
                        {pair.rightImageFile || pair.rightImageUrl ? (
                          <Box
                            component="img"
                            src={pair.rightImageFile ? URL.createObjectURL(pair.rightImageFile) : (pair.rightImageUrl || '')}
                            alt={`Right item ${pairIndex + 1}`}
                            sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                          />
                        ) : null}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveMatchingPair(pairIndex)}
                        sx={{ color: theme.palette.error.main, justifySelf: 'start' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onAddMatchingPair}
                    sx={{
                      mt: 1,
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                    }}
                    startIcon={<AddIcon />}
                  >
                    Add Pair
                  </Button>
                </Card>
              ) : <Card
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.01)',
                }}
              >
                {question.options.map((option, optionIndex) => (
                  (() => {
                    const shouldHighlightCorrect = showCorrectSelector && option.isCorrect;
                    return (
                  <Box
                    key={optionIndex}
                    onDragOver={(event) => {
                      if (!canAttachOptionImage) return;
                      event.preventDefault();
                      event.stopPropagation();
                      if (dragOverOptionIndex !== optionIndex) {
                        setDragOverOptionIndex(optionIndex);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverOptionIndex === optionIndex) {
                        setDragOverOptionIndex(null);
                      }
                    }}
                    onDrop={(event) => handleOptionImageDrop(event, optionIndex)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1,
                      border: `2px solid ${
                        dragOverOptionIndex === optionIndex && canAttachOptionImage
                          ? theme.palette.primary.main
                          :
                        shouldHighlightCorrect
                          ? theme.palette.success.main
                          : theme.palette.divider
                      }`,
                      backgroundColor: shouldHighlightCorrect
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
                      ...(dragOverOptionIndex === optionIndex && canAttachOptionImage
                        ? {
                            borderStyle: 'dashed',
                            boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                          }
                        : {}),
                    }}
                  >
                    {/* Correct Answer Selector */}
                    {showCorrectSelector && (
                      isSingleCorrectType ? (
                        <Radio
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
                      ) : (
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
                      )
                    )}

                    {/* Option Letter/Number */}
                    <Box
                      sx={{
                        minWidth: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: shouldHighlightCorrect
                          ? theme.palette.success.main
                          : theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                        color: shouldHighlightCorrect
                          ? '#fff'
                          : theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {isOrderType ? optionIndex + 1 : String.fromCharCode(65 + optionIndex)}
                    </Box>

                    {/* Answer Text Input */}
                    <TextField
                      variant="standard"
                      fullWidth
                      value={option.text}
                      onChange={(e) => onOptionChange(optionIndex, 'text', e.target.value)}
                      placeholder={isOrderType
                        ? `Enter item ${optionIndex + 1}`
                        : `Enter answer option ${String.fromCharCode(65 + optionIndex)}${canAttachOptionImage ? ' (optional if image set)' : ''}`}
                      disabled={question.type === 'true_false'}
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

                    {question.type !== 'true_false' ? (
                      <Box
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (dragOverOptionIndex !== optionIndex) {
                            setDragOverOptionIndex(optionIndex);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverOptionIndex === optionIndex) {
                            setDragOverOptionIndex(null);
                          }
                        }}
                        onDrop={(event) => handleOptionImageDrop(event, optionIndex)}
                        sx={{
                          flexShrink: 0,
                          borderRadius: 1,
                          border: '1px dashed',
                          borderColor: dragOverOptionIndex === optionIndex ? 'primary.main' : 'divider',
                          bgcolor: dragOverOptionIndex === optionIndex
                            ? 'action.hover'
                            : 'transparent',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          sx={{
                            flexShrink: 0,
                            minWidth: 96,
                            border: 0,
                            color: dragOverOptionIndex === optionIndex ? 'primary.main' : 'inherit',
                            '&:hover': { border: 0 },
                          }}
                        >
                          {dragOverOptionIndex === optionIndex
                            ? 'Drop Image'
                            : option.imageFile || option.imageUrl
                              ? 'Image Set'
                              : 'Add Image'}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              onOptionChange(optionIndex, 'imageFile', file);
                            }}
                          />
                        </Button>
                      </Box>
                    ) : null}

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      onClick={() => onDeleteOption(optionIndex)}
                      disabled={question.options.length <= 2 || question.type === 'true_false'}
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
                    );
                  })()
                ))}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={onAddOption}
                  sx={{ mt: 1 }}
                  startIcon={<AddIcon />}
                  fullWidth
                  disabled={question.type === 'true_false'}
                >
                  {isOrderType ? 'Add Item' : 'Add Answer Option'}
                </Button>
              </Card>)}
            </Box>}
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
  const [slides, setSlides] = useState<PresentationSlideForm[]>([]);
  const [questions, setQuestions] = useState<QuizQuestionForm[]>(() => [createInitialQuestion()]);
  const [timelineItems, setTimelineItems] = useState<TimelineItemRef[]>([]);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set([questions[0].id]));
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const hasOptionContent = (option: QuizQuestionForm['options'][number]) =>
    Boolean(option.text.trim()) || Boolean(option.imageFile) || Boolean((option.imageUrl || '').trim()) || Boolean((option.imageId || '').trim());
  const hasMatchingSideContent = (text: string, imageFile: File | null, imageUrl?: string, imageId?: string) =>
    Boolean(text.trim()) || Boolean(imageFile) || Boolean((imageUrl || '').trim()) || Boolean((imageId || '').trim());
  const getMatchingPreviewImageSrc = (file: File | null, url?: string) =>
    file ? URL.createObjectURL(file) : (url || '');

  useEffect(() => {
    if (timelineItems.length === 0 && questions.length > 0) {
      const firstTimelineId = `timeline-${Date.now()}-${Math.random()}`;
      setTimelineItems([{ id: firstTimelineId, kind: "question", refId: questions[0].id }]);
      setSelectedTimelineId(firstTimelineId);
    }
  }, [timelineItems.length, questions]);

  // Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Pagination
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const end = start + QUESTIONS_PER_PAGE;
    return questions.slice(start, end).map((q, idx) => ({
      ...q,
      globalIndex: start + idx,
    }));
  }, [questions, currentPage]);

  const timelinePreviewItems = useMemo(() => {
    return timelineItems
      .map((itemRef, timelineIndex) => {
        if (itemRef.kind === "slide") {
          const slideIndex = slides.findIndex((slide) => slide.id === itemRef.refId);
          if (slideIndex < 0) return null;
          return {
            timelineId: itemRef.id,
            kind: "slide" as const,
            timelineIndex,
            slideIndex,
            slide: slides[slideIndex],
          };
        }

        const questionIndex = questions.findIndex((question) => question.id === itemRef.refId);
        if (questionIndex < 0) return null;
        return {
          timelineId: itemRef.id,
          kind: "question" as const,
          timelineIndex,
          questionIndex,
          question: questions[questionIndex],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [timelineItems, slides, questions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTimelineItems((items) => {
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

    if (field === 'type') {
      const selectedType = value as string;
      const isPairedType = selectedType === 'matching';
      const isPhraseType = selectedType === 'match_the_phrase';
      const currentQuestionText = updatedQuestions[globalIndex].question || '';

      if (selectedType === 'fill_in_blank' && !currentQuestionText.match(/_{3,}/)) {
        updatedQuestions[globalIndex].question = `${currentQuestionText}${currentQuestionText ? ' ' : ''}____`;
      }

      if (selectedType === 'true_false') {
        updatedQuestions[globalIndex].options = [
          { text: 'True', isCorrect: true, imageUrl: '', imageId: '', imageFile: null },
          { text: 'False', isCorrect: false, imageUrl: '', imageId: '', imageFile: null },
        ];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (selectedType === 'essay') {
        updatedQuestions[globalIndex].options = [{ text: '', isCorrect: false, imageUrl: '', imageId: '', imageFile: null }];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (selectedType === 'short_answer' || selectedType === 'fill_in_blank' || selectedType === 'numerical' || selectedType === 'calendar') {
        updatedQuestions[globalIndex].options = [];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (isPhraseType) {
        updatedQuestions[globalIndex].options = [];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (isPairedType) {
        updatedQuestions[globalIndex].options = [];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        if (updatedQuestions[globalIndex].matchingPairs.length < 2) {
          updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
        }
      } else if (updatedQuestions[globalIndex].options.length < 2) {
        updatedQuestions[globalIndex].options = [
          { text: '', isCorrect: true, imageUrl: '', imageId: '', imageFile: null },
          { text: '', isCorrect: false, imageUrl: '', imageId: '', imageFile: null },
        ];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      }

      if (selectedType === 'multiple') {
        const firstCorrectIndex = updatedQuestions[globalIndex].options.findIndex((opt) => opt.isCorrect);
        updatedQuestions[globalIndex].options = updatedQuestions[globalIndex].options.map((opt, idx) => ({
          ...opt,
          isCorrect: firstCorrectIndex >= 0 ? idx === firstCorrectIndex : idx === 0,
        }));
      }
    }

    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (
    globalIndex: number,
    optionIndex: number,
    field: 'text' | 'isCorrect' | 'imageUrl' | 'imageId' | 'imageFile',
    value: string | boolean | File | null
  ) => {
    const updatedQuestions = [...questions];
    const updatedOptions = [...updatedQuestions[globalIndex].options];
    const qType = updatedQuestions[globalIndex].type;

    if (field === 'isCorrect' && value === true && (qType === 'multiple' || qType === 'dropdown' || qType === 'true_false')) {
      updatedQuestions[globalIndex].options = updatedOptions.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === optionIndex,
      }));
      setQuestions(updatedQuestions);
      return;
    }

    if (field === 'isCorrect' && value === false) {
      if (qType === 'multi_select') {
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          [field]: value,
        };

        updatedQuestions[globalIndex].options = updatedOptions;
        setQuestions(updatedQuestions);
        return;
      }

      const currentCorrectCount = updatedOptions.filter((opt) => opt.isCorrect).length;
      if (updatedOptions[optionIndex].isCorrect && currentCorrectCount === 1) {
        return;
      }
    }

    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value,
    };

    updatedQuestions[globalIndex].options = updatedOptions;
    setQuestions(updatedQuestions);
  };

  const addSlide = () => {
    const newSlide = createInitialSlide();
    const timelineId = `timeline-${Date.now()}-${Math.random()}`;
    setSlides((prev) => [...prev, newSlide]);
    setTimelineItems((prev) => [...prev, { id: timelineId, kind: 'slide', refId: newSlide.id }]);
    setSelectedTimelineId(timelineId);
  };

  const addQuestion = () => {
    const newQuestion = createInitialQuestion();
    newQuestion.points = 1;
    setQuestions([...questions, newQuestion]);
    const timelineId = `timeline-${Date.now()}-${Math.random()}`;
    setTimelineItems((prev) => [...prev, { id: timelineId, kind: 'question', refId: newQuestion.id }]);
    setSelectedTimelineId(timelineId);
    setExpandedQuestions(new Set([newQuestion.id]));
    const newPage = Math.ceil((questions.length + 1) / QUESTIONS_PER_PAGE);
    setCurrentPage(newPage);
  };

  const updateSlide = <K extends keyof PresentationSlideForm>(
    slideId: string,
    field: K,
    value: PresentationSlideForm[K]
  ) => {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === slideId ? { ...slide, [field]: value } : slide))
    );
  };

  const deleteSlide = (slideId: string) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
    setTimelineItems((prev) => prev.filter((item) => !(item.kind === 'slide' && item.refId === slideId)));
  };

  const addOption = (globalIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].options.push({ text: "", isCorrect: false, imageUrl: '', imageId: '', imageFile: null });
    setQuestions(updatedQuestions);
  };

  const addMatchingPair = (globalIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].matchingPairs.push({
      left: '',
      right: '',
      leftImageUrl: '',
      leftImageId: '',
      leftImageFile: null,
      rightImageUrl: '',
      rightImageId: '',
      rightImageFile: null,
    });
    setQuestions(updatedQuestions);
  };

  const removeMatchingPair = (globalIndex: number, pairIndex: number) => {
    if (questions[globalIndex].matchingPairs.length <= 2) {
      showSnackbar("Matching questions need at least two pairs", "error");
      return;
    }

    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].matchingPairs = updatedQuestions[globalIndex].matchingPairs.filter((_, index) => index !== pairIndex);
    setQuestions(updatedQuestions);
  };

  const updateMatchingPair = (globalIndex: number, pairIndex: number, field: 'left' | 'right', value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].matchingPairs[pairIndex] = {
      ...updatedQuestions[globalIndex].matchingPairs[pairIndex],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const updateMatchingPairImage = (globalIndex: number, pairIndex: number, side: 'left' | 'right', file: File | null) => {
    const updatedQuestions = [...questions];
    const pair = updatedQuestions[globalIndex].matchingPairs[pairIndex];
    if (!pair) return;

    updatedQuestions[globalIndex].matchingPairs[pairIndex] = side === 'left'
      ? {
          ...pair,
          leftImageFile: file,
          leftImageUrl: file ? '' : pair.leftImageUrl,
          leftImageId: file ? '' : pair.leftImageId,
        }
      : {
          ...pair,
          rightImageFile: file,
          rightImageUrl: file ? '' : pair.rightImageUrl,
          rightImageId: file ? '' : pair.rightImageId,
        };

    setQuestions(updatedQuestions);
  };

  const addAcceptedAnswer = (globalIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[globalIndex];
    const value = question.acceptedAnswerInput.trim();

    if (!value) return;

    if (!question.acceptedAnswers.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      question.acceptedAnswers = [...question.acceptedAnswers, value];
    }

    question.acceptedAnswerInput = '';
    setQuestions(updatedQuestions);
  };

  const removeAcceptedAnswer = (globalIndex: number, answerIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].acceptedAnswers = updatedQuestions[globalIndex].acceptedAnswers.filter((_, idx) => idx !== answerIndex);
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
    setTimelineItems((prev) => prev.filter((item) => !(item.kind === 'question' && item.refId === questionId)));
    
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
    if (
      updatedQuestions[globalIndex].type !== 'multi_select' &&
      !updatedQuestions[globalIndex].options.some((opt) => opt.isCorrect) &&
      updatedQuestions[globalIndex].options.length > 0
    ) {
      updatedQuestions[globalIndex].options[0].isCorrect = true;
    }
    setQuestions(updatedQuestions);
  };

  const transformQuestionForSubmission = (question: QuizQuestionForm): QuizQuestion => {
    const typeName = question.type === "multiple" ? "multiple_choice" : question.type;
    const acceptedTextAnswers = question.acceptedAnswers
      .flatMap((ans) => ans.split('|'))
      .map((ans) => ans.trim())
      .filter(Boolean);
    const matchingPairs = question.matchingPairs
      .map((pair, index) => ({
        left: pair.left.trim() || (hasMatchingSideContent(pair.left, pair.leftImageFile, pair.leftImageUrl, pair.leftImageId) ? `Left Image ${index + 1}` : ''),
        right: pair.right.trim() || (hasMatchingSideContent(pair.right, pair.rightImageFile, pair.rightImageUrl, pair.rightImageId) ? `Right Image ${index + 1}` : ''),
      }))
      .filter((pair) => pair.left && pair.right);

    const getOptionLabel = (opt: QuizQuestionForm['options'][number], index: number) => {
      const trimmedText = opt.text.trim();
      if (trimmedText) return trimmedText;

      const hasImage = Boolean(opt.imageFile) || Boolean((opt.imageUrl || '').trim()) || Boolean((opt.imageId || '').trim());
      return hasImage ? `Image ${String.fromCharCode(65 + index)}` : '';
    };

    const optionEntries = question.options.map((opt, index) => ({
      opt,
      index,
      label: getOptionLabel(opt, index),
    }));
    const options = optionEntries.map((entry) => entry.label);
    const correctAnswers = optionEntries.filter((entry) => entry.opt.isCorrect).map((entry) => entry.label);
    const incorrectAnswers = optionEntries.filter((entry) => !entry.opt.isCorrect).map((entry) => entry.label);
    const optionImageUrls = question.options.map((opt) => (opt.imageUrl || '').trim());
    const optionImageIds = question.options.map((opt) => (opt.imageId || '').trim());
    const matchingAnswerStrings = matchingPairs.map((pair) => `${pair.left}:${pair.right}`);

    let typeObj: QuizQuestion["type"];

    switch (typeName) {
      case "multiple_choice":
        typeObj = {
          name: "multiple_choice",
          description: "multiple_choice question",
          options,
          correctAnswer: correctAnswers[0] || "",
          incorrectAnswers,
        };
        break;
      case "multi_select":
        typeObj = {
          name: "multi_select",
          description: "multi_select question",
          options,
          correctAnswers,
          incorrectAnswers,
        };
        break;
      case "dropdown":
        typeObj = {
          name: "dropdown",
          description: "dropdown question",
          options,
          correctAnswer: correctAnswers[0] || "",
        };
        break;
      case "true_false":
        typeObj = {
          name: "true_false",
          description: "true_false question",
          correctAnswer: correctAnswers[0] || "",
        };
        break;
      case "short_answer":
        typeObj = {
          name: "short_answer",
          description: "short_answer question",
          correctAnswers: acceptedTextAnswers,
        };
        break;
      case "fill_in_blank":
        typeObj = {
          name: "fill_in_blank",
          description: "fill_in_blank question",
          correctAnswers: acceptedTextAnswers,
        };
        break;
      case "numerical": {
        const parsed = Number((question.acceptedAnswers[0] || '').trim());
        typeObj = {
          name: "numerical",
          description: "numerical question",
          correctAnswer: Number.isFinite(parsed) ? parsed : 0,
        };
        break;
      }
      case "essay":
        typeObj = {
          name: "essay",
          description: "essay question",
        };
        break;
      case "match_the_phrase":
        typeObj = {
          name: "match_the_phrase",
          description: "drag-to-match phrase question",
          phrase: question.question,
          slots: Array.from({ length: Math.max(0, question.question.split(/_{3,}/).length - 1) }, (_, index) => `blank${index + 1}`),
          options,
          correctAssign: Object.fromEntries(
            Array.from({ length: Math.max(0, question.question.split(/_{3,}/).length - 1) }, (_, index) => [
              `blank${index + 1}`,
              (question.acceptedAnswers[index] || '').trim(),
            ])
          ),
        };
        break;
      case "matching":
        typeObj = {
          name: "matching",
          description: "matching question",
          leftItems: matchingPairs.map((pair) => pair.left),
          rightItems: matchingPairs.map((pair) => pair.right),
          correctMatches: Object.fromEntries(matchingPairs.map((pair) => [pair.left, pair.right])),
        };
        break;
      case "ranking":
        typeObj = {
          name: "ranking",
          description: "ranking question",
          items: options,
          correctOrder: options,
        };
        break;
      case "ordering":
        typeObj = {
          name: "ordering",
          description: "ordering question",
          items: options,
          correctOrder: options,
        };
        break;
      case "image_based":
        typeObj = {
          name: "image_based",
          description: "image_based question",
          imageUrl: question.imageUrl.trim(),
          correctAnswers,
        };
        break;
      case "calendar":
        typeObj = {
          name: "calendar",
          description: "calendar question",
          correctAnswers: acceptedTextAnswers,
        };
        break;
      default:
        typeObj = {
          name: "multiple_choice",
          description: "multiple_choice question",
          options,
          correctAnswer: correctAnswers[0] || "",
          incorrectAnswers,
        };
    }

    return {
      question: question.question,
      points: question.points,
      difficulty: question.difficulty,
      hint: question.hint,
      imageUrl: question.imageUrl.trim(),
      imageId: (question.imageId || '').trim() || undefined,
      explanation: question.explanation.trim(),
      optionImageUrls,
      optionImageIds,
      type: typeObj,
      category: question.category,
      options: typeName === 'matching'
        ? []
        : options,
      correctAnswers: typeName === 'short_answer' || typeName === 'fill_in_blank' || typeName === 'match_the_phrase' || typeName === 'calendar'
        ? acceptedTextAnswers
        : typeName === 'matching'
          ? matchingAnswerStrings
          : correctAnswers,
      incorrectAnswers,
    };
  };

  const validateQuiz = (): boolean => {
    if (!quizName.trim()) {
      showSnackbar("Quiz name is required", "error");
      return false;
    }

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const hasContent = slide.title.trim() || slide.content.trim() || slide.imageUrl.trim();
      if (!hasContent) {
        showSnackbar(`Slide ${i + 1} is empty. Add title/content/image or remove it.`, "error");
        return false;
      }
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showSnackbar(`Question ${i + 1} text is required`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }

      if (q.type === 'essay') {
        continue;
      }

      if (q.type === 'short_answer') {
        if (q.acceptedAnswers.length < 1) {
          showSnackbar(`Question ${i + 1} needs at least one accepted answer`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }
        continue;
      }

      if (q.type === 'calendar') {
        if (q.acceptedAnswers.length < 1) {
          showSnackbar(`Question ${i + 1} needs at least one correct date in YYYY-MM-DD format`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }
        const allValidDates = q.acceptedAnswers.every((date) =>
          /^\d{4}-\d{2}-\d{2}$/.test(date.trim())
        );
        if (!allValidDates) {
          showSnackbar(`Question ${i + 1} has invalid date format. Use YYYY-MM-DD.`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }
        continue;
      }

      if (q.type === 'numerical') {
        const value = (q.acceptedAnswers[0] || '').trim();
        if (!value || !Number.isFinite(Number(value))) {
          showSnackbar(`Question ${i + 1} needs a valid numerical answer`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }
        continue;
      }

      if (q.type === 'fill_in_blank') {
        const blankParts = q.question.split('____');
        const blankCount = Math.max(0, blankParts.length - 1);

        if (blankCount < 1) {
          showSnackbar(`Question ${i + 1} must include at least one blank (____)`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        const allBlankAnswersFilled = Array.from({ length: blankCount }).every((_, blankIndex) => {
          const rawValue = q.acceptedAnswers[blankIndex] || '';
          return rawValue
            .split('|')
            .map((value) => value.trim())
            .filter(Boolean)
            .length > 0;
        });

        if (!allBlankAnswersFilled) {
          showSnackbar(`Question ${i + 1} must have at least one answer for each blank`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        continue;
      }

      if (q.type === 'match_the_phrase') {
        const blankParts = q.question.split(/_{3,}/);
        const blankCount = Math.max(0, blankParts.length - 1);

        if (blankCount < 1) {
          showSnackbar(`Question ${i + 1} needs at least one blank (___)`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        if (q.acceptedAnswers.length < blankCount || q.acceptedAnswers.slice(0, blankCount).some((ans) => !ans.trim())) {
          showSnackbar(`Question ${i + 1} needs an answer for each blank`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        if (q.options.length < blankCount) {
          showSnackbar(`Question ${i + 1} needs a word bank for the blanks`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        if (q.options.some((opt) => !hasOptionContent(opt))) {
          showSnackbar(`All words in the word bank for Question ${i + 1} must have text or an image`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        continue;
      }

      if (q.type === 'matching') {
        const pairs = q.matchingPairs.map((pair) => ({
          left: pair.left.trim(),
          right: pair.right.trim(),
          hasLeftContent: hasMatchingSideContent(pair.left, pair.leftImageFile, pair.leftImageUrl, pair.leftImageId),
          hasRightContent: hasMatchingSideContent(pair.right, pair.rightImageFile, pair.rightImageUrl, pair.rightImageId),
        }));

        if (pairs.length < 2) {
          showSnackbar(`Question ${i + 1} needs at least two matching pairs`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        if (pairs.some((pair) => !pair.hasLeftContent || !pair.hasRightContent)) {
          showSnackbar(`All matching pairs for Question ${i + 1} must have text or an image on each side`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        const leftValues = pairs.map((pair) => pair.left.toLowerCase()).filter(Boolean);
        const rightValues = pairs.map((pair) => pair.right.toLowerCase()).filter(Boolean);
        if (new Set(leftValues).size !== leftValues.length || new Set(rightValues).size !== rightValues.length) {
          showSnackbar(`Question ${i + 1} cannot repeat matching items`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        continue;
      }

      const options = q.options.filter((opt) => hasOptionContent(opt));
      if (options.length < 1) {
        showSnackbar(`Question ${i + 1} needs at least one option/item`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }

      const allOptionsFilled = q.options.every((opt) => hasOptionContent(opt));
      if (!allOptionsFilled) {
        showSnackbar(`All options for Question ${i + 1} must have text or an image`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }

      if (q.type === 'ranking' || q.type === 'ordering') {
        if (q.options.length < 2) {
          showSnackbar(`Question ${i + 1} must have at least two items`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }
        continue;
      }

      const correctCount = q.options.filter(opt => opt.isCorrect).length;
      if (q.type === 'dropdown' || q.type === 'true_false') {
        if (correctCount !== 1) {
          showSnackbar(`Question ${i + 1} must have exactly one correct answer`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }
      } else if (q.type !== 'multi_select' && correctCount < 1) {
        showSnackbar(`Question ${i + 1} must have at least one correct answer`, "error");
        const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
        setCurrentPage(page);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const slideMap = new Map(slides.map((s) => [s.id, s]));

    const quizItems: QuizItem[] = [];
    const orderedQuestionForms: QuizQuestionForm[] = [];

    for (const item of timelineItems) {
      if (item.kind === 'slide') {
        const slide = slideMap.get(item.refId);
        if (!slide) continue;
        quizItems.push({
          kind: 'slide',
          slide: {
            title: slide.title.trim(),
            content: slide.content.trim(),
            imageUrl: slide.imageUrl.trim(),
          },
        });
      } else {
        const question = questionMap.get(item.refId);
        if (!question) continue;
        const transformed = transformQuestionForSubmission(question);
        orderedQuestionForms.push(question);
        quizItems.push({ kind: 'question', question: transformed });
      }
    }

    const transformedQuestions = quizItems
      .filter((item): item is QuizItem & { question: QuizQuestion } => item.kind === 'question' && Boolean(item.question))
      .map((item) => item.question);

    const quiz: Quiz = {
      quizName,
      quizDescription,
      createdBy: "Test_User",
      quizQuestions: transformedQuestions,
      quizItems,
    };

    const extractQuizId = (payload: any): string | undefined => {
      if (!payload || typeof payload !== 'object') return undefined;
      return payload.quizId || payload.id || payload._id || payload?.quiz?.id || payload?.quiz?._id;
    };

    const uploadQuestionImage = async (quizId: string, questionIndex: number, file: File) => {
      const form = new FormData();
      form.append('image', file);

      const response = await fetch(
        `${backendUrl}/api/quizzes/${encodeURIComponent(quizId)}/questions/${questionIndex}/image`,
        {
          method: 'POST',
          body: form,
        }
      );

      if (!response.ok) {
        throw new Error(`Question image upload failed for question ${questionIndex + 1}`);
      }

      return response.json().catch(() => ({}));
    };

    const uploadOptionImage = async (quizId: string, questionIndex: number, optionIndex: number, file: File) => {
      const form = new FormData();
      form.append('image', file);

      const response = await fetch(
        `${backendUrl}/api/quizzes/${encodeURIComponent(quizId)}/questions/${questionIndex}/options/${optionIndex}/image`,
        {
          method: 'POST',
          body: form,
        }
      );

      if (!response.ok) {
        throw new Error(`Option image upload failed for question ${questionIndex + 1}, option ${optionIndex + 1}`);
      }

      return response.json().catch(() => ({}));
    };

    try {
      const response = await fetch(`${backendUrl}/api/create-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        const quizId = extractQuizId(payload);

        const hasImageUploads = orderedQuestionForms.some((q) =>
          Boolean(q.imageFile) || q.options.some((opt) => Boolean(opt.imageFile))
        );

        if (hasImageUploads && quizId) {
          let uploadCount = 0;
          for (let qIndex = 0; qIndex < orderedQuestionForms.length; qIndex += 1) {
            const q = orderedQuestionForms[qIndex];

            if (q.imageFile) {
              const uploaded = await uploadQuestionImage(quizId, qIndex, q.imageFile);
              uploadCount += 1;
              if (uploaded.imageUrl) {
                transformedQuestions[qIndex].imageUrl = uploaded.imageUrl;
              }
              if (uploaded.imageId) {
                transformedQuestions[qIndex].imageId = uploaded.imageId;
              }
            }

            for (let oIndex = 0; oIndex < q.options.length; oIndex += 1) {
              const opt = q.options[oIndex];
              if (!opt.imageFile) continue;

              const uploaded = await uploadOptionImage(quizId, qIndex, oIndex, opt.imageFile);
              uploadCount += 1;

              if (uploaded.imageUrl) {
                if (!transformedQuestions[qIndex].optionImageUrls) {
                  transformedQuestions[qIndex].optionImageUrls = q.options.map(() => '');
                }
                transformedQuestions[qIndex].optionImageUrls![oIndex] = uploaded.imageUrl;
              }

              if (uploaded.imageId) {
                if (!transformedQuestions[qIndex].optionImageIds) {
                  transformedQuestions[qIndex].optionImageIds = q.options.map(() => '');
                }
                transformedQuestions[qIndex].optionImageIds![oIndex] = uploaded.imageId;
              }
            }
          }

          showSnackbar(`Quiz created successfully! Uploaded ${uploadCount} image${uploadCount === 1 ? '' : 's'}.`, "success");
        } else if (hasImageUploads && !quizId) {
          showSnackbar("Quiz created, but image upload was skipped (missing quiz id in response).", "error");
        } else {
          showSnackbar("Quiz created successfully!", "success");
        }

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
    const timelineId = `timeline-${Date.now()}-${Math.random()}`;
    setQuizName("");
    setQuizDescription("");
    setSlides([]);
    setQuestions([newQuestion]);
    setTimelineItems([{ id: timelineId, kind: 'question', refId: newQuestion.id }]);
    setSelectedTimelineId(timelineId);
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '260px minmax(0, 1fr)' }, gap: 2, mb: 3 }}>
            <Card
              sx={{
                height: 'fit-content',
                position: { lg: 'sticky' },
                top: { lg: 12 },
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa',
                boxShadow: 'none',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.25 }}>
                  Sequence Preview
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                  Click an item to jump and edit.
                </Typography>
                <Box sx={{ display: 'grid', gap: 1, maxHeight: 560, overflowY: 'auto', pr: 0.5 }}>
                  {timelinePreviewItems.map((item) => (
                    <Box
                      key={item.timelineId}
                      onClick={() => {
                        setSelectedTimelineId(item.timelineId);
                        if (item.kind === 'question') {
                          setExpandedQuestions(new Set([item.question.id]));
                        }
                      }}
                      sx={{
                        border: '1px solid',
                        borderColor: selectedTimelineId === item.timelineId
                          ? (item.kind === 'slide' ? 'info.main' : 'secondary.main')
                          : 'divider',
                        borderRadius: 1.5,
                        p: 1,
                        cursor: 'pointer',
                        bgcolor: selectedTimelineId === item.timelineId
                          ? (item.kind === 'slide' ? 'rgba(3,169,244,0.10)' : 'rgba(255,107,149,0.10)')
                          : 'transparent',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                        #{item.timelineIndex + 1} • {item.kind === 'slide' ? `Slide ${item.slideIndex + 1}` : `Question ${item.questionIndex + 1}`}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.kind === 'slide'
                          ? (item.slide.title || item.slide.content || 'Untitled slide')
                          : (item.question.question || 'Untitled question')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa',
                boxShadow: 'none',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="h6" fontWeight="700">Unified Timeline</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button size="small" onClick={expandAll}>Expand All</Button>
                    <Button size="small" onClick={collapseAll}>Collapse All</Button>
                    <Chip size="small" color="secondary" label={`${timelinePreviewItems.length} items`} />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Slides and questions live in one sequence. Drag to reorder.
                </Typography>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={timelinePreviewItems.map((item) => item.timelineId)} strategy={verticalListSortingStrategy}>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      {timelinePreviewItems.map((item, listIndex) => (
                        item.kind === 'slide' ? (
                          <Card
                            key={item.timelineId}
                            variant="outlined"
                            sx={{
                              borderColor: selectedTimelineId === item.timelineId ? 'info.main' : 'divider',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(3,169,244,0.08)' : 'rgba(3,169,244,0.05)',
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  #{listIndex + 1} • Slide {item.slideIndex + 1}
                                </Typography>
                                <IconButton size="small" onClick={() => deleteSlide(item.slide.id)} sx={{ color: 'error.main' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <TextField
                                label="Slide Title"
                                fullWidth
                                size="small"
                                sx={{ mb: 1.25 }}
                                value={item.slide.title}
                                onChange={(e) => updateSlide(item.slide.id, 'title', e.target.value)}
                              />
                              <TextField
                                label="Slide Content"
                                fullWidth
                                size="small"
                                multiline
                                rows={3}
                                sx={{ mb: 1.25 }}
                                value={item.slide.content}
                                onChange={(e) => updateSlide(item.slide.id, 'content', e.target.value)}
                              />
                              <TextField
                                label="Slide Image URL (Optional)"
                                fullWidth
                                size="small"
                                value={item.slide.imageUrl}
                                onChange={(e) => updateSlide(item.slide.id, 'imageUrl', e.target.value)}
                              />
                            </CardContent>
                          </Card>
                        ) : (
                          <SortableQuestionCard
                            key={item.timelineId}
                            sortableId={item.timelineId}
                            question={item.question}
                            index={item.questionIndex}
                            globalIndex={item.questionIndex}
                            expanded={expandedQuestions.has(item.question.id)}
                            onToggle={() => {
                              setSelectedTimelineId(item.timelineId);
                              toggleExpanded(item.question.id);
                            }}
                            onDelete={() => deleteQuestion(item.questionIndex)}
                            onChange={(field, value) => handleQuestionChange(item.questionIndex, field, value)}
                            onOptionChange={(optionIndex, field, value) =>
                              handleOptionChange(item.questionIndex, optionIndex, field, value)
                            }
                            onAddOption={() => addOption(item.questionIndex)}
                            onDeleteOption={(optionIndex) => deleteOption(item.questionIndex, optionIndex)}
                            onAddAcceptedAnswer={() => addAcceptedAnswer(item.questionIndex)}
                            onRemoveAcceptedAnswer={(answerIndex) => removeAcceptedAnswer(item.questionIndex, answerIndex)}
                            onAddMatchingPair={() => addMatchingPair(item.questionIndex)}
                            onRemoveMatchingPair={(pairIndex) => removeMatchingPair(item.questionIndex, pairIndex)}
                            onUpdateMatchingPair={(pairIndex, field, value) =>
                              updateMatchingPair(item.questionIndex, pairIndex, field, value)
                            }
                            onUpdateMatchingPairImage={(pairIndex, side, file) =>
                              updateMatchingPairImage(item.questionIndex, pairIndex, side, file)
                            }
                            totalQuestions={questions.length}
                          />
                        )
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ height: 72 }} />
        </Box>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 -6px 24px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 1.5, display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            <Button variant="contained" color="info" onClick={addSlide} startIcon={<AddIcon />}>
              Add Slide
            </Button>
            <Button variant="contained" color="primary" onClick={addQuestion} startIcon={<AddIcon />}>
              Add Question
            </Button>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={handlePreviewOpen}
            startIcon={<VisibilityIcon />}
            sx={{ fontWeight: 800 }}
          >
            Preview & Submit Quiz
          </Button>
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
                label={`${slides.length} Slide${slides.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{ mr: 1 }}
                variant="outlined"
              />
              <Chip 
                label={`${questions.reduce((sum, q) => sum + q.points, 0)} Total Points`} 
                size="small"
                color="primary"
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Slides Preview */}
          {slides.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Presentation Slides
              </Typography>
              {slides.map((slide, slideIndex) => (
                <Card
                  key={slide.id}
                  sx={{
                    mb: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Slide {slideIndex + 1}
                    </Typography>
                    {slide.title && (
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        {slide.title}
                      </Typography>
                    )}
                    {slide.content && (
                      <Typography variant="body1" sx={{ mb: slide.imageUrl ? 1.5 : 0 }}>
                        {slide.content}
                      </Typography>
                    )}
                    {slide.imageUrl && (
                      <Box
                        component="img"
                        src={slide.imageUrl}
                        alt={`Slide ${slideIndex + 1}`}
                        sx={{
                          width: '100%',
                          maxWidth: 520,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          boxShadow: '0 8px 18px rgba(0,0,0,0.10)',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              <Divider sx={{ mt: 1, mb: 3 }} />
            </Box>
          )}

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
                  {q.type === 'short_answer' || q.type === 'fill_in_blank'
                    ? 'Accepted Answers:'
                    : q.type === 'calendar'
                      ? 'Correct Date(s):'
                    : q.type === 'numerical'
                      ? 'Correct Number:'
                      : q.type === 'match_the_phrase'
                        ? 'Phrase Match:'
                      : 'Answer Options:'}
                </Typography>

                {(q.type === 'short_answer' || q.type === 'fill_in_blank' || q.type === 'calendar') ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {q.acceptedAnswers.length > 0 ? q.acceptedAnswers.map((ans, ansIdx) => (
                      <Chip
                        key={`${ans}-${ansIdx}`}
                        icon={<CheckCircleIcon />}
                        label={ans}
                        color="success"
                        variant="outlined"
                      />
                    )) : (
                      <Typography variant="body2" color="text.secondary">(No answer set)</Typography>
                    )}
                  </Box>
                  ) : q.type === 'match_the_phrase' ? (
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}>
                        <Typography variant="body2" sx={{ lineHeight: 2 }}>
                          {q.question.split(/_{3,}/).map((segment, segmentIndex, segmentArray) => (
                            <span key={`preview-segment-${segmentIndex}`}>
                              {segment}
                              {segmentIndex < segmentArray.length - 1 && (
                                <Chip
                                  label={q.acceptedAnswers[segmentIndex] || `blank ${segmentIndex + 1}`}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                  sx={{ mx: 0.5, height: 24 }}
                                />
                              )}
                            </span>
                          ))}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {q.options.map((option, idx) => (
                          <Chip key={`bank-${idx}`} label={option.text} variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                ) : q.type === 'matching' ? (
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {q.matchingPairs.map((pair, pairIdx) => (
                      <Box
                        key={`preview-match-${pairIdx}`}
                        sx={{
                          p: 1.25,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
                          gap: 1,
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'grid', gap: 0.5 }}>
                          {(pair.leftImageFile || pair.leftImageUrl) ? (
                            <Box
                              component="img"
                              src={getMatchingPreviewImageSrc(pair.leftImageFile, pair.leftImageUrl)}
                              alt={`Matching left ${pairIdx + 1}`}
                              sx={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                            />
                          ) : null}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {pair.left || `Left item ${pairIdx + 1}`}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                          matches
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 0.5 }}>
                          {(pair.rightImageFile || pair.rightImageUrl) ? (
                            <Box
                              component="img"
                              src={getMatchingPreviewImageSrc(pair.rightImageFile, pair.rightImageUrl)}
                              alt={`Matching right ${pairIdx + 1}`}
                              sx={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                            />
                          ) : null}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {pair.right || `Right item ${pairIdx + 1}`}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : q.type === 'numerical' ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(q.acceptedAnswers[0] || '').trim() ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={q.acceptedAnswers[0]}
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">(No number set)</Typography>
                    )}
                  </Box>
                ) : (
                  q.options.map((option, oIndex) => (
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
                  ))
                )}
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