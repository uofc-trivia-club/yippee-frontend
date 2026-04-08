import { Box, Button } from "@mui/material";

interface MultipleChoiceQuestionProps {
  options: string[];
  selectedAnswers: string[];
  onAnswerSelect: (option: string) => void;
  disabled: boolean;
}

export default function MultipleChoiceQuestion({
  options,
  selectedAnswers,
  onAnswerSelect,
  disabled,
}: MultipleChoiceQuestionProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {options.map((option) => (
        <Button
          key={option}
          onClick={() => onAnswerSelect(option)}
          variant={selectedAnswers.includes(option) ? "contained" : "outlined"}
          sx={{ m: 1, minWidth: '120px' }}
          disabled={disabled}
        >
          {option}
        </Button>
      ))}
    </Box>
  );
}
