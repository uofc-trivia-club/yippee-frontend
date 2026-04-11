import { Alert, Autocomplete, Badge, Box, Button, Card, CardContent, Checkbox, Chip, Collapse, Divider, FormControlLabel, IconButton, MenuItem, Pagination, Radio, RadioGroup, Snackbar, TextField, Typography, useTheme } from "@mui/material";
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
import { Fragment, useMemo, useState } from "react";

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
  acceptedAnswers: string[];
  acceptedAnswerInput: string;
  category: string[];
  matchingPairs: Array<{
    left: string;
    right: string;
  }>;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
};

const createMatchingPairs = () => ([
  { left: "", right: "" },
  { left: "", right: "" },
]);

const createInitialQuestion = (): QuizQuestionForm => ({
  id: `question-${Date.now()}-${Math.random()}`,
  question: "",
  points: 1,
  difficulty: 1,
  hint: "",
  type: "multiple",
  acceptedAnswers: [],
  acceptedAnswerInput: "",
  category: [],
  matchingPairs: createMatchingPairs(),
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
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
  { value: 'ordering', label: 'Ordering' },
  { value: 'match_the_phrase', label: 'Match the Phrase' },
  { value: 'matching', label: 'Matching' },
  { value: 'image_based', label: 'Image Based' },
] as const;

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
  onAddAcceptedAnswer,
  onRemoveAcceptedAnswer,
  onAddMatchingPair,
  onRemoveMatchingPair,
  onUpdateMatchingPair,
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
  onAddAcceptedAnswer: () => void;
  onRemoveAcceptedAnswer: (answerIndex: number) => void;
  onAddMatchingPair: () => void;
  onRemoveMatchingPair: (pairIndex: number) => void;
  onUpdateMatchingPair: (pairIndex: number, field: 'left' | 'right', value: string) => void;
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
  const isFreeTextType = question.type === 'short_answer';
  const isFillInBlankType = question.type === 'fill_in_blank';
  const isNumericalType = question.type === 'numerical';
  const isDropdownType = question.type === 'dropdown';
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
  const isValid = isFreeTextType
    ? question.question.trim() && question.acceptedAnswers.length > 0
    : isNumericalType
      ? question.question.trim() && Number.isFinite(Number((question.acceptedAnswers[0] || '').trim()))
    : isFillInBlankType
      ? question.question.trim() && blankAnswersValid
    : isPhraseMatchType
      ? question.question.trim() && blankAnswersValid && question.options.every((opt) => opt.text.trim())
    : isPairType
      ? question.question.trim() && question.matchingPairs.length >= 2 && question.matchingPairs.every(pair => pair.left.trim() && pair.right.trim())
      : question.question.trim() && (allowsNoCorrect || correctAnswersCount > 0) && question.options.every(opt => opt.text.trim());
  const isEssayType = question.type === 'essay';
  const isOrderType = question.type === 'ranking' || question.type === 'ordering';
  const isSingleCorrectType = question.type === 'multiple' || question.type === 'dropdown' || question.type === 'true_false';
  const usesOptionsEditor = !isFreeTextType && !isFillInBlankType && !isNumericalType && !isPhraseMatchType;
  const showCorrectSelector = !isEssayType && !isOrderType;
  const currentDropdownCorrectIndex = question.options.findIndex((opt) => opt.isCorrect);
  const dropdownBlankValue = currentDropdownCorrectIndex >= 0 ? question.options[currentDropdownCorrectIndex].text : '';

  const handleFillBlankAnswerChange = (blankIndex: number, value: string) => {
    const nextAnswers = [...question.acceptedAnswers];
    nextAnswers[blankIndex] = value;
    onChange('acceptedAnswers', nextAnswers);
  };

  const handleDropdownBlankAnswerChange = (value: string) => {
    const targetIndex = currentDropdownCorrectIndex >= 0 ? currentDropdownCorrectIndex : 0;
    onOptionChange(targetIndex, 'isCorrect', true);
    onOptionChange(targetIndex, 'text', value);
  };

  const handlePhraseAnswerChange = (blankIndex: number, value: string) => {
    const nextAnswers = [...question.acceptedAnswers];
    nextAnswers[blankIndex] = value;
    onChange('acceptedAnswers', nextAnswers);

    if (value && !question.options.some((option) => option.text.toLowerCase() === value.toLowerCase())) {
      onChange('options', [...question.options, { text: value, isCorrect: false }]);
    }
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
              onChange={(e) => onChange("question", e.target.value)}
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
                          <TextField
                            size="small"
                            value={question.acceptedAnswers[index] || ''}
                            onChange={(e) => handlePhraseAnswerChange(index, e.target.value)}
                            placeholder={`Blank ${index + 1} answer`}
                            sx={{ minWidth: 160, bgcolor: theme.palette.background.paper, borderRadius: 1 }}
                          />
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
                        placeholder={`Word ${optionIndex + 1}`}
                      />
                      <IconButton size="small" onClick={() => onDeleteOption(optionIndex)} disabled={question.options.length <= 1} sx={{ color: theme.palette.error.main }}>
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
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onChange('question', `${question.question}${question.question ? ' ' : ''}____`)}
                >
                  Insert Blank (____)
                </Button>
              </Box>
            )}

            {(isFillInBlankType || isDropdownType) && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {isFillInBlankType
                    ? 'Type answers directly in the blanks below. For multiple acceptable answers in one blank, separate with | (example: color|colour).'
                    : 'Type the dropdown correct answer directly in the first blank below.'}
                </Typography>

                {hasBlankTokens ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    {blankSegments.map((segment, index) => (
                      <Fragment key={`blank-segment-${index}`}>
                        {segment && (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {segment}
                          </Typography>
                        )}
                        {index < blankSegments.length - 1 && (
                          <Box sx={{ minWidth: 180 }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={
                                isFillInBlankType
                                  ? (question.acceptedAnswers[index] || '')
                                  : index === 0
                                    ? dropdownBlankValue
                                    : ''
                              }
                              onChange={(e) => {
                                if (isFillInBlankType) {
                                  handleFillBlankAnswerChange(index, e.target.value);
                                  return;
                                }

                                if (index === 0) {
                                  handleDropdownBlankAnswerChange(e.target.value);
                                }
                              }}
                              disabled={isDropdownType && index > 0}
                              placeholder={isDropdownType && index > 0 ? 'Use first blank only' : `Blank ${index + 1}`}
                              sx={{ bgcolor: theme.palette.background.paper, borderRadius: 1 }}
                            />
                            {isFillInBlankType && (
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
                            )}
                          </Box>
                        )}
                      </Fragment>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Example: "The capital of France is ____." or "The largest planet is [_____]."
                  </Typography>
                )}
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

            {isFillInBlankType && (
              <Box sx={{ mb: 0.5 }} />
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
                    : isDropdownType
                      ? 'Pick one correct option. The correct option text is synced with the first blank editor.'
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
                        alignItems: 'center',
                        mb: 1.5,
                      }}
                    >
                      <TextField
                        label={`Left item ${pairIndex + 1}`}
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={pair.left}
                        onChange={(e) => onUpdateMatchingPair(pairIndex, 'left', e.target.value)}
                      />
                      <TextField
                        label={`Right item ${pairIndex + 1}`}
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={pair.right}
                        onChange={(e) => onUpdateMatchingPair(pairIndex, 'right', e.target.value)}
                      />
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
                        : `Enter answer option ${String.fromCharCode(65 + optionIndex)}`}
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

    if (field === 'type') {
      const selectedType = value as string;
      const isPairedType = selectedType === 'matching';
      const isPhraseType = selectedType === 'match_the_phrase';
      const currentQuestionText = updatedQuestions[globalIndex].question || '';

      if ((selectedType === 'fill_in_blank' || selectedType === 'dropdown' || selectedType === 'match_the_phrase') && !currentQuestionText.match(/_{3,}/)) {
        updatedQuestions[globalIndex].question = selectedType === 'match_the_phrase'
          ? 'The ___ jumps over the ___ dog'
          : `${currentQuestionText}${currentQuestionText ? ' ' : ''}____`;
      }

      if (selectedType === 'true_false') {
        updatedQuestions[globalIndex].options = [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (selectedType === 'essay') {
        updatedQuestions[globalIndex].options = [{ text: '', isCorrect: false }];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (selectedType === 'short_answer' || selectedType === 'fill_in_blank' || selectedType === 'numerical') {
        updatedQuestions[globalIndex].options = [];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      } else if (isPhraseType) {
        updatedQuestions[globalIndex].options = [
          { text: 'quick', isCorrect: false },
          { text: 'lazy', isCorrect: false },
          { text: 'brown', isCorrect: false },
          { text: 'fox', isCorrect: false },
        ];
        updatedQuestions[globalIndex].acceptedAnswers = ['fox', 'lazy'];
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
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ];
        updatedQuestions[globalIndex].acceptedAnswers = [];
        updatedQuestions[globalIndex].acceptedAnswerInput = '';
        updatedQuestions[globalIndex].matchingPairs = createMatchingPairs();
      }

      if (selectedType === 'dropdown') {
        const firstCorrectIndex = updatedQuestions[globalIndex].options.findIndex((opt) => opt.isCorrect);
        updatedQuestions[globalIndex].options = updatedQuestions[globalIndex].options.map((opt, idx) => ({
          ...opt,
          isCorrect: firstCorrectIndex >= 0 ? idx === firstCorrectIndex : idx === 0,
        }));
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

  const handleOptionChange = (globalIndex: number, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
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
          [field]: value
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

  const addMatchingPair = (globalIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[globalIndex].matchingPairs.push({ left: '', right: '' });
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
      .map((pair) => ({
        left: pair.left.trim(),
        right: pair.right.trim(),
      }))
      .filter((pair) => pair.left && pair.right);

    const correctAnswers = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.text);
    const incorrectAnswers = question.options
      .filter((opt) => !opt.isCorrect)
      .map((opt) => opt.text);
    const options = question.options.map((opt) => opt.text);
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
          imageUrl: "",
          correctAnswers,
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
      type: typeObj,
      category: question.category,
      options: typeName === 'matching'
        ? []
        : options,
      correctAnswers: typeName === 'short_answer' || typeName === 'fill_in_blank' || typeName === 'match_the_phrase'
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

        if (q.options.some((opt) => !opt.text.trim())) {
          showSnackbar(`All words in the word bank for Question ${i + 1} must be filled`, "error");
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
        }));

        if (pairs.length < 2) {
          showSnackbar(`Question ${i + 1} needs at least two matching pairs`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        if (pairs.some((pair) => !pair.left || !pair.right)) {
          showSnackbar(`All matching pairs for Question ${i + 1} must be filled`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        const leftValues = pairs.map((pair) => pair.left.toLowerCase());
        const rightValues = pairs.map((pair) => pair.right.toLowerCase());
        if (new Set(leftValues).size !== leftValues.length || new Set(rightValues).size !== rightValues.length) {
          showSnackbar(`Question ${i + 1} cannot repeat matching items`, "error");
          const page = Math.ceil((i + 1) / QUESTIONS_PER_PAGE);
          setCurrentPage(page);
          return false;
        }

        continue;
      }

      const options = q.options.filter(opt => opt.text.trim());
      if (options.length < 1) {
        showSnackbar(`Question ${i + 1} needs at least one option/item`, "error");
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
                  onAddAcceptedAnswer={() => addAcceptedAnswer(q.globalIndex)}
                  onRemoveAcceptedAnswer={(answerIndex) => removeAcceptedAnswer(q.globalIndex, answerIndex)}
                  onAddMatchingPair={() => addMatchingPair(q.globalIndex)}
                  onRemoveMatchingPair={(pairIndex) => removeMatchingPair(q.globalIndex, pairIndex)}
                  onUpdateMatchingPair={(pairIndex, field, value) =>
                    updateMatchingPair(q.globalIndex, pairIndex, field, value)
                  }
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
                  {q.type === 'short_answer' || q.type === 'fill_in_blank'
                    ? 'Accepted Answers:'
                    : q.type === 'numerical'
                      ? 'Correct Number:'
                      : q.type === 'match_the_phrase'
                        ? 'Phrase Match:'
                      : 'Answer Options:'}
                </Typography>

                {(q.type === 'short_answer' || q.type === 'fill_in_blank') ? (
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